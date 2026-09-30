import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.models import Question, TestCase, User
from app.schemas.schemas import QuestionCreate, QuestionUpdate, QuestionDetail, TestCaseCreate, TestCaseResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

def verify_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.post("/questions", response_model=QuestionDetail)
def create_question(
    q_in: QuestionCreate,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    slug = q_in.slug or re.sub(r'[^a-z0-9]+', '-', q_in.title.lower()).strip('-')
    if db.query(Question).filter(Question.slug == slug).first():
        slug = f"{slug}-{db.query(Question).count() + 1}"

    db_q = Question(
        title=q_in.title,
        slug=slug,
        category=q_in.category,
        subcategory=q_in.subcategory,
        difficulty=q_in.difficulty,
        tags=q_in.tags,
        description=q_in.description,
        input_format=q_in.input_format,
        output_format=q_in.output_format,
        constraints=q_in.constraints,
        examples=q_in.examples,
        time_limit=q_in.time_limit,
        memory_limit=q_in.memory_limit,
        supported_languages=q_in.supported_languages,
        explanation=q_in.explanation,
        solutions=q_in.solutions,
        estimated_time=q_in.estimated_time,
        is_published=q_in.is_published
    )
    db.add(db_q)
    db.commit()
    db.refresh(db_q)

    # Add Test Cases
    for tc in q_in.test_cases:
        db_tc = TestCase(
            question_id=db_q.id,
            input_data=tc.input_data,
            expected_output=tc.expected_output,
            test_type=tc.test_type,
            is_sample=tc.is_sample
        )
        db.add(db_tc)
    db.commit()

    return db_q

@router.put("/questions/{question_id}", response_model=QuestionDetail)
def update_question(
    question_id: int,
    q_in: QuestionUpdate,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    update_data = q_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(q, field, val)

    db.commit()
    db.refresh(q)
    return q

@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"message": "Question deleted successfully"}

@router.post("/questions/{question_id}/test-cases", response_model=TestCaseResponse)
def add_test_case(
    question_id: int,
    tc_in: TestCaseCreate,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    tc = TestCase(
        question_id=question_id,
        input_data=tc_in.input_data,
        expected_output=tc_in.expected_output,
        test_type=tc_in.test_type,
        is_sample=tc_in.is_sample
    )
    db.add(tc)
    db.commit()
    db.refresh(tc)
    return tc

@router.get("/export-questions")
def export_questions(
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    questions = db.query(Question).all()
    export_data = []

    for q in questions:
        tcs = db.query(TestCase).filter(TestCase.question_id == q.id).all()
        tc_list = [
            {
                "input_data": tc.input_data,
                "expected_output": tc.expected_output,
                "test_type": tc.test_type,
                "is_sample": tc.is_sample
            }
            for tc in tcs
        ]
        export_data.append({
            "id": q.id,
            "title": q.title,
            "slug": q.slug,
            "category": q.category,
            "subcategory": q.subcategory,
            "difficulty": q.difficulty,
            "tags": q.tags,
            "description": q.description,
            "input_format": q.input_format,
            "output_format": q.output_format,
            "constraints": q.constraints,
            "examples": q.examples,
            "time_limit": q.time_limit,
            "memory_limit": q.memory_limit,
            "supported_languages": q.supported_languages,
            "explanation": q.explanation,
            "solutions": q.solutions,
            "estimated_time": q.estimated_time,
            "test_cases": tc_list
        })

    return {"count": len(export_data), "questions": export_data}

@router.post("/import-questions")
def import_questions(
    payload: Dict[str, Any],
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    qs = payload.get("questions", [])
    imported = 0

    for q_data in qs:
        slug = q_data.get("slug") or re.sub(r'[^a-z0-9]+', '-', q_data.get("title", "").lower()).strip('-')
        existing = db.query(Question).filter(Question.slug == slug).first()
        if existing:
            continue

        q = Question(
            title=q_data.get("title", "Untitled Question"),
            slug=slug,
            category=q_data.get("category", "General"),
            subcategory=q_data.get("subcategory"),
            difficulty=q_data.get("difficulty", "Easy"),
            tags=q_data.get("tags", []),
            description=q_data.get("description", ""),
            input_format=q_data.get("input_format", ""),
            output_format=q_data.get("output_format", ""),
            constraints=q_data.get("constraints", []),
            examples=q_data.get("examples", []),
            time_limit=q_data.get("time_limit", 2.0),
            memory_limit=q_data.get("memory_limit", 256),
            supported_languages=q_data.get("supported_languages", ["cpp", "java", "python"]),
            explanation=q_data.get("explanation"),
            solutions=q_data.get("solutions", {}),
            estimated_time=q_data.get("estimated_time", 15),
            is_published=True
        )
        db.add(q)
        db.commit()
        db.refresh(q)

        for tc_data in q_data.get("test_cases", []):
            tc = TestCase(
                question_id=q.id,
                input_data=tc_data.get("input_data", ""),
                expected_output=tc_data.get("expected_output", ""),
                test_type=tc_data.get("test_type", "public"),
                is_sample=tc_data.get("is_sample", False)
            )
            db.add(tc)
        db.commit()
        imported += 1

    return {"imported": imported, "message": f"Successfully imported {imported} questions"}
