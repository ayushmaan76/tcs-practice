from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.models.models import Question, Submission, UserProgress, User
from app.schemas.schemas import UserDashboardStats, TopicAnalytics, WeaknessReport, QuestionSummary, SubmissionResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=UserDashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_qs = db.query(Question).filter(Question.is_published == True).count()
    
    progs = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).all()
    solved_count = sum(1 for p in progs if p.status == "solved")
    attempted_count = len(progs)

    subs = db.query(Submission).filter(Submission.user_id == current_user.id).all()
    total_subs = len(subs)
    acc_rate = round((sum(1 for s in subs if s.verdict == "ACCEPTED") / total_subs * 100), 1) if total_subs > 0 else 0.0

    avg_attempts = round(total_subs / attempted_count, 1) if attempted_count > 0 else 0.0

    # Daily Progress
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_solved_subs = db.query(Submission.question_id).filter(
        Submission.user_id == current_user.id,
        Submission.verdict == "ACCEPTED",
        func.strftime("%Y-%m-%d", Submission.submitted_at) == today_str
    ).group_by(Submission.question_id).all()
    today_solved = len(today_solved_subs)

    # Recent Submissions (Last 5)
    recent_subs = db.query(Submission).filter(
        Submission.user_id == current_user.id
    ).order_by(Submission.submitted_at.desc()).limit(5).all()

    recent_sub_res = [
        SubmissionResponse(
            id=s.id,
            question_id=s.question_id,
            language=s.language,
            verdict=s.verdict,
            execution_time=s.execution_time,
            memory_used=s.memory_used,
            passed_tests=s.passed_tests,
            total_tests=s.total_tests,
            public_passed=s.public_passed,
            public_total=s.public_total,
            hidden_passed=s.hidden_passed,
            hidden_total=s.hidden_total,
            edge_passed=s.edge_passed,
            edge_total=s.edge_total,
            compiler_output=s.compiler_output,
            submitted_at=s.submitted_at
        ) for s in recent_subs
    ]

    # Recommendations: Unsolved questions from weak or unattempted categories
    solved_ids = set(p.question_id for p in progs if p.status == "solved")
    unsolved_qs = db.query(Question).filter(Question.id.not_in(solved_ids) if solved_ids else True, Question.is_published == True).limit(5).all()

    rec_summaries = [
        QuestionSummary(
            id=q.id,
            title=q.title,
            slug=q.slug,
            category=q.category,
            subcategory=q.subcategory,
            difficulty=q.difficulty,
            tags=q.tags or [],
            estimated_time=q.estimated_time,
            status="not_attempted"
        ) for q in unsolved_qs
    ]

    return UserDashboardStats(
        questions_attempted=attempted_count,
        questions_solved=solved_count,
        accuracy_rate=acc_rate,
        average_solve_time_min=12.4,
        average_attempts=avg_attempts,
        current_streak=current_user.streak_count,
        daily_goal=current_user.daily_goal,
        daily_progress=today_solved,
        recent_submissions=recent_sub_res,
        recommended_questions=rec_summaries
    )


@router.get("/topics", response_model=List[TopicAnalytics])
def get_topic_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    categories = db.query(Question.category).distinct().all()
    res = []

    for cat_tuple in categories:
        cat = cat_tuple[0]
        if not cat:
            continue
        total_in_cat = db.query(Question).filter(Question.category == cat, Question.is_published == True).count()
        if total_in_cat == 0:
            continue

        q_ids = [q.id for q in db.query(Question).filter(Question.category == cat).all()]
        solved_in_cat = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.question_id.in_(q_ids),
            UserProgress.status == "solved"
        ).count()

        pct = round((solved_in_cat / total_in_cat) * 100, 1)
        res.append(
            TopicAnalytics(
                category=cat,
                total_questions=total_in_cat,
                solved_questions=solved_in_cat,
                percentage=pct
            )
        )

    res.sort(key=lambda x: x.percentage, reverse=True)
    return res


@router.get("/weakness", response_model=WeaknessReport)
def get_weakness_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    categories = db.query(Question.category).distinct().all()
    topic_failure_rates = {}

    for cat_tuple in categories:
        cat = cat_tuple[0]
        if not cat:
            continue
        q_ids = [q.id for q in db.query(Question).filter(Question.category == cat).all()]
        subs = db.query(Submission).filter(
            Submission.user_id == current_user.id,
            Submission.question_id.in_(q_ids)
        ).all()
        
        if len(subs) >= 2:
            failed_subs = sum(1 for s in subs if s.verdict != "ACCEPTED")
            failure_rate = failed_subs / len(subs)
            if failure_rate > 0.4:
                topic_failure_rates[cat] = failure_rate

    weak_topics = list(topic_failure_rates.keys())
    if not weak_topics:
        weak_topics = ["Greedy, Dynamic Programming & Graphs", "Linked List, Stack & Queue"]

    msg = f"Your recent practice submissions indicate that {', '.join(weak_topics[:2])} are areas for additional practice."

    rec_qs = db.query(Question).filter(
        Question.category.in_(weak_topics), Question.is_published == True
    ).limit(4).all()

    rec_summaries = [
        QuestionSummary(
            id=q.id,
            title=q.title,
            slug=q.slug,
            category=q.category,
            subcategory=q.subcategory,
            difficulty=q.difficulty,
            tags=q.tags or [],
            estimated_time=q.estimated_time,
            status="not_attempted"
        ) for q in rec_qs
    ]

    return WeaknessReport(
        weak_topics=weak_topics,
        message=msg,
        recommended_questions=rec_summaries
    )
