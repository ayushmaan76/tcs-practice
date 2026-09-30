from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="candidate")  # 'candidate', 'admin'
    daily_goal = Column(Integer, default=3)
    streak_count = Column(Integer, default=0)
    last_active_date = Column(String(10), nullable=True)  # YYYY-MM-DD
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    exams = relationship("ExamSession", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    subcategory = Column(String(100), index=True, nullable=True)
    difficulty = Column(String(20), index=True, nullable=False)  # Easy, Medium, Hard
    tags = Column(JSON, default=list)  # ["arrays", "prime", ...]
    description = Column(Text, nullable=False)
    input_format = Column(Text, nullable=False)
    output_format = Column(Text, nullable=False)
    constraints = Column(JSON, default=list)  # ["2 <= N <= 100000", ...]
    examples = Column(JSON, default=list)  # [{"input": "...", "output": "...", "explanation": "..."}]
    time_limit = Column(Float, default=2.0)
    memory_limit = Column(Integer, default=256)
    supported_languages = Column(JSON, default=lambda: ["cpp", "java", "python"])
    explanation = Column(Text, nullable=True)
    solutions = Column(JSON, default=dict)  # {"cpp": "...", "java": "...", "python": "..."}
    estimated_time = Column(Integer, default=15)  # minutes
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    test_cases = relationship("TestCase", back_populates="question", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="question", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="question", cascade="all, delete-orphan")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    test_type = Column(String(20), default="public")  # 'public', 'hidden', 'edge', 'stress'
    is_sample = Column(Boolean, default=False)

    question = relationship("Question", back_populates="test_cases")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    language = Column(String(20), nullable=False)  # 'cpp', 'java', 'python'
    source_code = Column(Text, nullable=False)
    verdict = Column(String(30), nullable=False)  # ACCEPTED, WRONG_ANSWER, COMPILATION_ERROR, TIME_LIMIT_EXCEEDED, MEMORY_LIMIT_EXCEEDED, RUNTIME_ERROR
    execution_time = Column(Float, default=0.0)
    memory_used = Column(Float, default=0.0)
    passed_tests = Column(Integer, default=0)
    total_tests = Column(Integer, default=0)
    public_passed = Column(Integer, default=0)
    public_total = Column(Integer, default=0)
    hidden_passed = Column(Integer, default=0)
    hidden_total = Column(Integer, default=0)
    edge_passed = Column(Integer, default=0)
    edge_total = Column(Integer, default=0)
    compiler_output = Column(Text, nullable=True)
    mode = Column(String(20), default="strict")  # 'strict', 'practice', 'learning'
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="submissions")
    question = relationship("Question", back_populates="submissions")


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    duration_minutes = Column(Integer, default=90)
    total_questions = Column(Integer, default=6)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ends_at = Column(DateTime, nullable=False)
    status = Column(String(20), default="in_progress")  # 'in_progress', 'completed', 'timed_out'
    total_score = Column(Float, default=0.0)
    score_breakdown = Column(JSON, default=dict)
    mode = Column(String(20), default="strict")

    user = relationship("User", back_populates="exams")
    questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan")


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exam_sessions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    order_index = Column(Integer, nullable=False)
    user_code = Column(Text, default="")
    language = Column(String(20), default="cpp")
    status = Column(String(20), default="not_attempted")  # 'not_attempted', 'submitted', 'review'
    submission_id = Column(Integer, ForeignKey("submissions.id", ondelete="SET NULL"), nullable=True)

    exam = relationship("ExamSession", back_populates="questions")
    question = relationship("Question")


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="bookmarks")
    question = relationship("Question", back_populates="bookmarks")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="not_attempted")  # 'not_attempted', 'attempted', 'solved'
    best_verdict = Column(String(30), nullable=True)
    solve_count = Column(Integer, default=0)
    attempt_count = Column(Integer, default=0)
    total_time_spent = Column(Integer, default=0)  # seconds
    last_attempted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="progress")
    question = relationship("Question")
