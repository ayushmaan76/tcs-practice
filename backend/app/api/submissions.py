from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Question, TestCase, Submission, UserProgress, User
from app.schemas.schemas import CustomExecutionRequest, CustomExecutionResponse, SubmissionCreate, SubmissionResponse, SubmissionDetail
from app.api.auth import get_current_user
from app.judge.execution import run_code
from app.judge.test_runner import judge_submission

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.post("/run-custom", response_model=CustomExecutionResponse)
def run_custom_input(
    req: CustomExecutionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    time_limit = 2.0
    memory_limit = 256
    if req.question_id:
        q = db.query(Question).filter(Question.id == req.question_id).first()
        if q:
            time_limit = q.time_limit
            memory_limit = q.memory_limit

    res = run_code(
        language=req.language,
        source_code=req.source_code,
        input_data=req.custom_input,
        time_limit=time_limit,
        memory_limit=memory_limit
    )

    out_text = res.stdout if res.status == "OK" else (res.stderr or "No output")
    return CustomExecutionResponse(
        status=res.status,
        output=out_text,
        compiler_output=res.compiler_output,
        execution_time=res.wall_time,
        memory_used=res.memory_mb
    )

@router.post("", response_model=SubmissionResponse)
def submit_solution(
    sub_in: SubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.id == sub_in.question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    test_cases = db.query(TestCase).filter(TestCase.question_id == q.id).all()
    tc_dicts = [
        {
            "id": tc.id,
            "input_data": tc.input_data,
            "expected_output": tc.expected_output,
            "test_type": tc.test_type
        }
        for tc in test_cases
    ]

    judged = judge_submission(
        language=sub_in.language,
        source_code=sub_in.source_code,
        test_cases=tc_dicts,
        time_limit=q.time_limit,
        memory_limit=q.memory_limit
    )

    db_sub = Submission(
        user_id=current_user.id,
        question_id=q.id,
        language=sub_in.language,
        source_code=sub_in.source_code,
        verdict=judged["verdict"],
        execution_time=judged["execution_time"],
        memory_used=judged["memory_used"],
        passed_tests=judged["passed_tests"],
        total_tests=judged["total_tests"],
        public_passed=judged["public_passed"],
        public_total=judged["public_total"],
        hidden_passed=judged["hidden_passed"],
        hidden_total=judged["hidden_total"],
        edge_passed=judged["edge_passed"],
        edge_total=judged["edge_total"],
        compiler_output=judged.get("compiler_output"),
        mode=sub_in.mode
    )
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)

    # Update User Progress
    prog = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id, UserProgress.question_id == q.id
    ).first()

    if not prog:
        prog = UserProgress(
            user_id=current_user.id,
            question_id=q.id,
            status="solved" if judged["verdict"] == "ACCEPTED" else "attempted",
            best_verdict=judged["verdict"],
            solve_count=1 if judged["verdict"] == "ACCEPTED" else 0,
            attempt_count=1
        )
        db.add(prog)
    else:
        prog.attempt_count += 1
        prog.last_attempted_at = datetime.now(timezone.utc)
        if judged["verdict"] == "ACCEPTED":
            prog.status = "solved"
            prog.solve_count += 1
            prog.best_verdict = "ACCEPTED"
        elif prog.status != "solved":
            prog.status = "attempted"
            prog.best_verdict = judged["verdict"]

    db.commit()
    return db_sub

@router.get("/history/{question_id}", response_model=List[SubmissionResponse])
def get_submission_history(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subs = db.query(Submission).filter(
        Submission.user_id == current_user.id, Submission.question_id == question_id
    ).order_by(Submission.submitted_at.desc()).all()
    return subs

@router.get("/{submission_id}", response_model=SubmissionDetail)
def get_submission_detail(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    if sub.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    q = db.query(Question).filter(Question.id == sub.question_id).first()
    
    return SubmissionDetail(
        id=sub.id,
        question_id=sub.question_id,
        question_title=q.title if q else "Unknown",
        language=sub.language,
        source_code=sub.source_code,
        verdict=sub.verdict,
        execution_time=sub.execution_time,
        memory_used=sub.memory_used,
        passed_tests=sub.passed_tests,
        total_tests=sub.total_tests,
        public_passed=sub.public_passed,
        public_total=sub.public_total,
        hidden_passed=sub.hidden_passed,
        hidden_total=sub.hidden_total,
        edge_passed=sub.edge_passed,
        edge_total=sub.edge_total,
        compiler_output=sub.compiler_output,
        submitted_at=sub.submitted_at
    )
