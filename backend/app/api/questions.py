from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, asc, desc
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Question, TestCase, Bookmark, UserProgress, User
from app.schemas.schemas import QuestionSummary, QuestionDetail, TestCaseResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/questions", tags=["Questions"])

@router.get("", response_model=List[QuestionSummary])
def get_questions(
    search: Optional[str] = Query(None, description="Search query by title, topic, tag, difficulty, concept, question #"),
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    difficulty: Optional[str] = None,
    status: Optional[str] = None,  # All, Solved, Unsolved, Attempted, Not Attempted, Bookmarked
    tag: Optional[str] = None,
    sort_by: Optional[str] = "id",  # id, difficulty, estimated_time, recently_added
    sort_order: Optional[str] = "asc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Question).filter(Question.is_published == True)

    # 1. Search Query Logic
    if search:
        search_term = search.strip()
        # Check if search is numeric ID
        if search_term.isdigit():
            qid = int(search_term)
            query = query.filter(or_(Question.id == qid, Question.title.ilike(f"%{search_term}%")))
        else:
            pattern = f"%{search_term}%"
            query = query.filter(
                or_(
                    Question.title.ilike(pattern),
                    Question.category.ilike(pattern),
                    Question.subcategory.ilike(pattern),
                    Question.difficulty.ilike(pattern),
                    Question.description.ilike(pattern)
                )
            )

    # 2. Filters
    if category and category != "All":
        query = query.filter(Question.category == category)
    if subcategory:
        query = query.filter(Question.subcategory == subcategory)
    if difficulty and difficulty != "All":
        query = query.filter(Question.difficulty == difficulty)

    # User Progress & Bookmark Map
    user_bookmarks = set(
        b.question_id for b in db.query(Bookmark).filter(Bookmark.user_id == current_user.id).all()
    )
    user_prog_map = {
        p.question_id: p.status for p in db.query(UserProgress).filter(UserProgress.user_id == current_user.id).all()
    }

    questions = query.all()
    filtered_results = []

    for q in questions:
        q_status = user_prog_map.get(q.id, "not_attempted")
        is_bm = q.id in user_bookmarks

        # Tag Filter
        if tag and tag.lower() not in [t.lower() for t in (q.tags or [])]:
            continue

        # Status Filter
        if status:
            if status == "Solved" and q_status != "solved":
                continue
            elif status == "Unsolved" and q_status == "solved":
                continue
            elif status == "Attempted" and q_status != "attempted":
                continue
            elif status == "Not Attempted" and q_status != "not_attempted":
                continue
            elif status == "Bookmarked" and not is_bm:
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
            status=q_status,
            is_bookmarked=is_bm
        )
        filtered_results.append(summary)

    # 3. Sorting
    reverse = (sort_order.lower() == "desc")
    if sort_by == "difficulty":
        diff_order = {"Easy": 1, "Medium": 2, "Hard": 3}
        filtered_results.sort(key=lambda x: diff_order.get(x.difficulty, 2), reverse=reverse)
    elif sort_by == "estimated_time":
        filtered_results.sort(key=lambda x: x.estimated_time, reverse=reverse)
    elif sort_by == "recently_added":
        filtered_results.sort(key=lambda x: x.id, reverse=True)
    else:  # id
        filtered_results.sort(key=lambda x: x.id, reverse=reverse)

    return filtered_results


@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Question.category).distinct().all()
    return [c[0] for c in categories if c[0]]


@router.get("/{question_id_or_slug}", response_model=QuestionDetail)
def get_question_detail(
    question_id_or_slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if question_id_or_slug.isdigit():
        q = db.query(Question).filter(Question.id == int(question_id_or_slug)).first()
    else:
        q = db.query(Question).filter(Question.slug == question_id_or_slug).first()

    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    is_bm = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id, Bookmark.question_id == q.id
    ).first() is not None

    prog = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id, UserProgress.question_id == q.id
    ).first()
    status_str = prog.status if prog else "not_attempted"

    # Only return public & sample test cases to frontend (never expose hidden tests)
    public_tests = db.query(TestCase).filter(
        TestCase.question_id == q.id,
        or_(TestCase.test_type == "public", TestCase.is_sample == True)
    ).all()

    tc_responses = [
        TestCaseResponse(
            id=tc.id,
            question_id=tc.question_id,
            input_data=tc.input_data,
            expected_output=tc.expected_output,
            test_type=tc.test_type,
            is_sample=tc.is_sample
        )
        for tc in public_tests
    ]

    return QuestionDetail(
        id=q.id,
        title=q.title,
        slug=q.slug,
        category=q.category,
        subcategory=q.subcategory,
        difficulty=q.difficulty,
        tags=q.tags or [],
        description=q.description,
        input_format=q.input_format,
        output_format=q.output_format,
        constraints=q.constraints or [],
        examples=q.examples or [],
        time_limit=q.time_limit,
        memory_limit=q.memory_limit,
        supported_languages=q.supported_languages or ["cpp", "java", "python"],
        explanation=q.explanation,
        solutions=q.solutions or {},
        estimated_time=q.estimated_time,
        is_published=q.is_published,
        created_at=q.created_at,
        test_cases=tc_responses,
        is_bookmarked=is_bm,
        status=status_str
    )


@router.post("/{question_id}/bookmark")
def toggle_bookmark(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    bm = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id, Bookmark.question_id == question_id
    ).first()

    if bm:
        db.delete(bm)
        db.commit()
        return {"bookmarked": False, "message": "Bookmark removed"}
    else:
        new_bm = Bookmark(user_id=current_user.id, question_id=question_id)
        db.add(new_bm)
        db.commit()
        return {"bookmarked": True, "message": "Question bookmarked"}
