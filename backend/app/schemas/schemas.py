from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- AUTH SCHEMAS ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    daily_goal: int
    streak_count: int
    last_active_date: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- TEST CASE SCHEMAS ---
class TestCaseBase(BaseModel):
    input_data: str
    expected_output: str
    test_type: str = "public"  # public, hidden, edge, stress
    is_sample: bool = False

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseResponse(TestCaseBase):
    id: int
    question_id: int

    class Config:
        from_attributes = True


# --- QUESTION SCHEMAS ---
class QuestionBase(BaseModel):
    title: str
    category: str
    subcategory: Optional[str] = None
    difficulty: str  # Easy, Medium, Hard
    tags: List[str] = []
    description: str
    input_format: str
    output_format: str
    constraints: List[str] = []
    examples: List[Dict[str, Any]] = []
    time_limit: float = 2.0
    memory_limit: int = 256
    supported_languages: List[str] = ["cpp", "java", "python"]
    explanation: Optional[str] = None
    solutions: Dict[str, str] = {}
    estimated_time: int = 15
    is_published: bool = True

class QuestionCreate(QuestionBase):
    slug: Optional[str] = None
    test_cases: List[TestCaseCreate] = []

class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    difficulty: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[List[str]] = None
    examples: Optional[List[Dict[str, Any]]] = None
    time_limit: Optional[float] = None
    memory_limit: Optional[int] = None
    explanation: Optional[str] = None
    solutions: Optional[Dict[str, str]] = None
    estimated_time: Optional[int] = None
    is_published: Optional[bool] = None

class QuestionSummary(BaseModel):
    id: int
    title: str
    slug: str
    category: str
    subcategory: Optional[str] = None
    difficulty: str
    tags: List[str]
    estimated_time: int
    status: Optional[str] = "not_attempted"  # not_attempted, attempted, solved
    is_bookmarked: bool = False

    class Config:
        from_attributes = True

class QuestionDetail(QuestionBase):
    id: int
    slug: str
    created_at: datetime
    test_cases: List[TestCaseResponse] = []  # Filtered to only public/sample test cases for non-admin
    is_bookmarked: bool = False
    status: Optional[str] = "not_attempted"

    class Config:
        from_attributes = True


# --- SUBMISSION SCHEMAS ---
class CustomExecutionRequest(BaseModel):
    question_id: Optional[int] = None
    language: str  # cpp, java, python
    source_code: str
    custom_input: str

class CustomExecutionResponse(BaseModel):
    status: str  # OK, COMPILATION_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED
    output: str
    compiler_output: Optional[str] = None
    execution_time: float
    memory_used: float

class SubmissionCreate(BaseModel):
    question_id: int
    language: str
    source_code: str
    mode: str = "strict"  # strict, practice, learning

class SubmissionResponse(BaseModel):
    id: int
    question_id: int
    language: str
    verdict: str
    execution_time: float
    memory_used: float
    passed_tests: int
    total_tests: int
    public_passed: int
    public_total: int
    hidden_passed: int
    hidden_total: int
    edge_passed: int
    edge_total: int
    compiler_output: Optional[str] = None
    submitted_at: datetime

    class Config:
        from_attributes = True

class SubmissionDetail(SubmissionResponse):
    source_code: str
    question_title: Optional[str] = None


# --- EXAM SCHEMAS ---
class StartExamRequest(BaseModel):
    duration_minutes: int = 90
    total_questions: int = 6
    language: str = "cpp"
    mode: str = "strict"

class ExamQuestionItem(BaseModel):
    id: int
    order_index: int
    question: QuestionSummary
    user_code: str
    language: str
    status: str  # not_attempted, submitted, review

class ExamSessionResponse(BaseModel):
    id: int
    duration_minutes: int
    total_questions: int
    started_at: datetime
    ends_at: datetime
    remaining_seconds: int
    status: str
    questions: List[ExamQuestionItem] = []

class SaveExamProgressRequest(BaseModel):
    exam_question_id: int
    user_code: str
    language: str
    status: str  # not_attempted, submitted, review

class FinalizeExamResponse(BaseModel):
    exam_id: int
    status: str
    total_questions: int
    solved_count: int
    unsolved_count: int
    total_attempts: int
    time_used_seconds: int
    topic_breakdown: Dict[str, Dict[str, int]]
    questions_result: List[Dict[str, Any]]


# --- ANALYTICS SCHEMAS ---
class UserDashboardStats(BaseModel):
    questions_attempted: int
    questions_solved: int
    accuracy_rate: float
    average_solve_time_min: float
    average_attempts: float
    current_streak: int
    daily_goal: int
    daily_progress: int
    recent_submissions: List[SubmissionResponse] = []
    recommended_questions: List[QuestionSummary] = []

class TopicAnalytics(BaseModel):
    category: str
    total_questions: int
    solved_questions: int
    percentage: float

class WeaknessReport(BaseModel):
    weak_topics: List[str]
    message: str
    recommended_questions: List[QuestionSummary]
