import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.models.models import Question, ExamSession, ExamQuestion, Submission, UserProgress, User, TestCase
from app.schemas.schemas import StartExamRequest, ExamSessionResponse, ExamQuestionItem, QuestionSummary, SaveExamProgressRequest, FinalizeExamResponse
from app.api.auth import get_current_user
from app.judge.test_runner import judge_submission

router = APIRouter(prefix="/exams", tags=["Exams"])

@router.post("/start", response_model=ExamSessionResponse)
def start_exam(
    req: StartExamRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    easy_qs = db.query(Question).filter(Question.difficulty == "Easy", Question.is_published == True).all()
    med_qs = db.query(Question).filter(Question.difficulty == "Medium", Question.is_published == True).all()
    hard_qs = db.query(Question).filter(Question.difficulty == "Hard", Question.is_published == True).all()

    selected = []
    if len(easy_qs) >= 2:
        selected.extend(random.sample(easy_qs, 2))
    else:
        selected.extend(easy_qs)

    if len(med_qs) >= 3:
        selected.extend(random.sample(med_qs, 3))
    else:
        selected.extend(med_qs)

    if len(hard_qs) >= 1:
        selected.extend(random.sample(hard_qs, 1))
    else:
        selected.extend(hard_qs)

    all_published = db.query(Question).filter(Question.is_published == True).all()
    remaining = [q for q in all_published if q not in selected]
    while len(selected) < min(req.total_questions, len(all_published)):
        if remaining:
            q_pick = random.choice(remaining)
            selected.append(q_pick)
            remaining.remove(q_pick)
        else:
            break

    now = datetime.now(timezone.utc)
    ends_at = now + timedelta(minutes=req.duration_minutes)

    exam = ExamSession(
        user_id=current_user.id,
        duration_minutes=req.duration_minutes,
        total_questions=len(selected),
        started_at=now,
        ends_at=ends_at,
        status="in_progress",
        mode=req.mode
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    exam_questions = []
    for idx, q in enumerate(selected):
        eq = ExamQuestion(
            exam_id=exam.id,
            question_id=q.id,
            order_index=idx + 1,
            user_code=q.solutions.get(req.language, "") if isinstance(q.solutions, dict) else "",
            language=req.language,
            status="not_attempted"
        )
        db.add(eq)
        exam_questions.append(eq)

    db.commit()
    return _build_exam_response(exam, db, current_user.id)


@router.get("/active", response_model=Optional[ExamSessionResponse])
def get_active_exam(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exam = db.query(ExamSession).filter(
        ExamSession.user_id == current_user.id, ExamSession.status == "in_progress"
    ).order_by(ExamSession.started_at.desc()).first()

    if not exam:
        return None

    now = datetime.now(timezone.utc)
    ends_at_tz = exam.ends_at if exam.ends_at.tzinfo else exam.ends_at.replace(tzinfo=timezone.utc)
    if now >= ends_at_tz:
        exam.status = "timed_out"
        db.commit()
        return None

    return _build_exam_response(exam, db, current_user.id)


@router.get("/{exam_id}", response_model=ExamSessionResponse)
def get_exam_by_id(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exam = db.query(ExamSession).filter(ExamSession.id == exam_id).first()
    if not exam or (exam.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=404, detail="Exam session not found")
    return _build_exam_response(exam, db, current_user.id)


@router.post("/{exam_id}/save")
def save_exam_progress(
    exam_id: int,
    req: SaveExamProgressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exam = db.query(ExamSession).filter(ExamSession.id == exam_id, ExamSession.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam session not found")
    if exam.status != "in_progress":
        raise HTTPException(status_code=400, detail="Exam is no longer in progress")

    eq = db.query(ExamQuestion).filter(ExamQuestion.id == req.exam_question_id, ExamQuestion.exam_id == exam.id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Exam question not found")

    eq.user_code = req.user_code
    eq.language = req.language
    eq.status = req.status
    db.commit()

    return {"message": "Progress saved successfully"}


@router.post("/{exam_id}/finalize", response_model=FinalizeExamResponse)
def finalize_exam(
    exam_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exam = db.query(ExamSession).filter(ExamSession.id == exam_id, ExamSession.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam session not found")

    eqs = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam.id).order_by(ExamQuestion.order_index).all()

    solved_count = 0
    unsolved_count = 0
    total_attempts = 0
    topic_breakdown: Dict[str, Dict[str, int]] = {}
    q_results = []

    for eq in eqs:
        q = db.query(Question).filter(Question.id == eq.question_id).first()
        if not q:
            continue

        cat = q.category
        if cat not in topic_breakdown:
            topic_breakdown[cat] = {"solved": 0, "total": 0}
        topic_breakdown[cat]["total"] += 1

        if eq.user_code and eq.user_code.strip():
            total_attempts += 1
            test_cases = db.query(TestCase).filter(TestCase.question_id == q.id).all()
            tc_dicts = [{"input_data": tc.input_data, "expected_output": tc.expected_output, "test_type": tc.test_type} for tc in test_cases]

            judged = judge_submission(
                language=eq.language,
                source_code=eq.user_code,
                test_cases=tc_dicts,
                time_limit=q.time_limit,
                memory_limit=q.memory_limit
            )

            sub = Submission(
                user_id=current_user.id,
                question_id=q.id,
                language=eq.language,
                source_code=eq.user_code,
                verdict=judged["verdict"],
                execution_time=judged["execution_time"],
                memory_used=judged["memory_used"],
                passed_tests=judged["passed_tests"],
                total_tests=judged["total_tests"],
                compiler_output=judged.get("compiler_output"),
                mode="strict"
            )
            db.add(sub)
            db.commit()
            db.refresh(sub)
            eq.submission_id = sub.id

            is_solved = (judged["verdict"] == "ACCEPTED")
            if is_solved:
                solved_count += 1
                topic_breakdown[cat]["solved"] += 1
            else:
                unsolved_count += 1

            q_results.append({
                "question_id": q.id,
                "title": q.title,
                "category": q.category,
                "difficulty": q.difficulty,
                "verdict": judged["verdict"],
                "passed_tests": judged["passed_tests"],
                "total_tests": judged["total_tests"]
            })
        else:
            unsolved_count += 1
            q_results.append({
                "question_id": q.id,
                "title": q.title,
                "category": q.category,
                "difficulty": q.difficulty,
                "verdict": "NOT_ATTEMPTED",
                "passed_tests": 0,
                "total_tests": 0
            })

    exam.status = "completed"
    exam.total_score = round((solved_count / len(eqs)) * 100, 1) if eqs else 0.0
    exam.score_breakdown = topic_breakdown
    db.commit()

    started_tz = exam.started_at if exam.started_at.tzinfo else exam.started_at.replace(tzinfo=timezone.utc)
    time_used_sec = int((datetime.now(timezone.utc) - started_tz).total_seconds())

    return FinalizeExamResponse(
        exam_id=exam.id,
        status="completed",
        total_questions=len(eqs),
        solved_count=solved_count,
        unsolved_count=unsolved_count,
        total_attempts=total_attempts,
        time_used_seconds=max(0, time_used_sec),
        topic_breakdown=topic_breakdown,
        questions_result=q_results
    )


def _build_exam_response(exam: ExamSession, db: Session, user_id: int) -> ExamSessionResponse:
    now = datetime.now(timezone.utc)
    ends_at_tz = exam.ends_at if exam.ends_at.tzinfo else exam.ends_at.replace(tzinfo=timezone.utc)
    rem_sec = max(0, int((ends_at_tz - now).total_seconds()))

    eqs = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam.id).order_by(ExamQuestion.order_index).all()
    q_items = []

    for eq in eqs:
        q = db.query(Question).filter(Question.id == eq.question_id).first()
        if not q:
            continue
        summary = QuestionSummary(
            id=q.id,
            title=q.title,
            slug=q.slug,
            category=q.category,
            subcategory=q.subcategory,
            difficulty=q.difficulty,
            tags=q.tags or [],
            estimated_time=q.estimated_time,
            status=eq.status
        )
        q_items.append(
            ExamQuestionItem(
                id=eq.id,
                order_index=eq.order_index,
                question=summary,
                user_code=eq.user_code or "",
                language=eq.language or "cpp",
                status=eq.status
            )
        )

    started_tz = exam.started_at if exam.started_at.tzinfo else exam.started_at.replace(tzinfo=timezone.utc)
    return ExamSessionResponse(
        id=exam.id,
        duration_minutes=exam.duration_minutes,
        total_questions=exam.total_questions,
        started_at=started_tz,
        ends_at=ends_at_tz,
        remaining_seconds=rem_sec,
        status=exam.status,
        questions=q_items
    )
