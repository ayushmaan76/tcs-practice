export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  daily_goal: number;
  streak_count: number;
  last_active_date?: string;
  created_at: string;
}

export interface TestCase {
  id?: number;
  question_id?: number;
  input_data: string;
  expected_output: string;
  test_type: 'public' | 'hidden' | 'edge' | 'stress';
  is_sample: boolean;
}

export interface QuestionSummary {
  id: number;
  title: string;
  slug: string;
  category: string;
  subcategory?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  estimated_time: number;
  status: 'not_attempted' | 'attempted' | 'solved';
  is_bookmarked: boolean;
}

export interface QuestionDetail {
  id: number;
  title: string;
  slug: string;
  category: string;
  subcategory?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  description: string;
  input_format: string;
  output_format: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
  time_limit: number;
  memory_limit: number;
  supported_languages: string[];
  explanation?: string;
  solutions: Record<string, string>;
  estimated_time: number;
  is_published: boolean;
  created_at: string;
  test_cases: TestCase[];
  is_bookmarked: boolean;
  status: 'not_attempted' | 'attempted' | 'solved';
}

export interface Submission {
  id: number;
  question_id: number;
  question_title?: string;
  language: string;
  source_code?: string;
  verdict: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR';
  execution_time: number;
  memory_used: number;
  passed_tests: number;
  total_tests: number;
  public_passed: number;
  public_total: number;
  hidden_passed: number;
  hidden_total: number;
  edge_passed: number;
  edge_total: number;
  compiler_output?: string;
  submitted_at: string;
}

export interface ExamQuestionItem {
  id: number;
  order_index: number;
  question: QuestionSummary;
  user_code: string;
  language: string;
  status: 'not_attempted' | 'submitted' | 'review';
}

export interface ExamSession {
  id: number;
  duration_minutes: number;
  total_questions: number;
  started_at: string;
  ends_at: string;
  remaining_seconds: number;
  status: 'in_progress' | 'completed' | 'timed_out';
  questions: ExamQuestionItem[];
}

export interface DashboardStats {
  questions_attempted: number;
  questions_solved: number;
  accuracy_rate: number;
  average_solve_time_min: number;
  average_attempts: number;
  current_streak: number;
  daily_goal: number;
  daily_progress: number;
  recent_submissions: Submission[];
  recommended_questions: QuestionSummary[];
}

export interface TopicAnalytics {
  category: string;
  total_questions: number;
  solved_questions: number;
  percentage: number;
}

export interface WeaknessReport {
  weak_topics: string[];
  message: string;
  recommended_questions: QuestionSummary[];
}
