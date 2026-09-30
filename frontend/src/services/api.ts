import axios from 'axios';
import {
  User,
  QuestionSummary,
  QuestionDetail,
  Submission,
  ExamSession,
  DashboardStats,
  TopicAnalytics,
  WeaknessReport
} from '../types';

const API_BASE = 'http://localhost:8000/api/v1';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('tcs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (username: string, password: string): Promise<any> => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const res = await client.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res.data.access_token) {
      localStorage.setItem('tcs_token', res.data.access_token);
    }
    return res.data;
  },
  register: async (username: string, email: string, password: string): Promise<User> => {
    const res = await client.post('/auth/register', { username, email, password });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await client.get('/auth/me');
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('tcs_token');
  }
};

export const questionService = {
  getQuestions: async (params?: {
    search?: string;
    category?: string;
    subcategory?: string;
    difficulty?: string;
    status?: string;
    tag?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<QuestionSummary[]> => {
    const res = await client.get('/questions', { params });
    return res.data;
  },
  getCategories: async (): Promise<string[]> => {
    const res = await client.get('/questions/categories');
    return res.data;
  },
  getQuestionDetail: async (idOrSlug: string | number): Promise<QuestionDetail> => {
    const res = await client.get(`/questions/${idOrSlug}`);
    return res.data;
  },
  toggleBookmark: async (id: number): Promise<{ bookmarked: boolean; message: string }> => {
    const res = await client.post(`/questions/${id}/bookmark`);
    return res.data;
  }
};

export const submissionService = {
  runCustomInput: async (req: {
    question_id?: number;
    language: string;
    source_code: string;
    custom_input: string;
  }) => {
    const res = await client.post('/submissions/run-custom', req);
    return res.data;
  },
  submitSolution: async (req: {
    question_id: number;
    language: string;
    source_code: string;
    mode?: string;
  }): Promise<Submission> => {
    const res = await client.post('/submissions', req);
    return res.data;
  },
  getHistory: async (questionId: number): Promise<Submission[]> => {
    const res = await client.get(`/submissions/history/${questionId}`);
    return res.data;
  },
  getSubmissionDetail: async (submissionId: number): Promise<Submission> => {
    const res = await client.get(`/submissions/${submissionId}`);
    return res.data;
  }
};

export const examService = {
  startExam: async (req?: {
    duration_minutes?: number;
    total_questions?: number;
    language?: string;
    mode?: string;
  }): Promise<ExamSession> => {
    const res = await client.post('/exams/start', req || {});
    return res.data;
  },
  getActiveExam: async (): Promise<ExamSession | null> => {
    const res = await client.get('/exams/active');
    return res.data;
  },
  getExamById: async (id: number): Promise<ExamSession> => {
    const res = await client.get(`/exams/${id}`);
    return res.data;
  },
  saveProgress: async (
    examId: number,
    examQuestionId: number,
    userCode: string,
    language: string,
    status: string
  ) => {
    const res = await client.post(`/exams/${examId}/save`, {
      exam_question_id: examQuestionId,
      user_code: userCode,
      language: language,
      status: status
    });
    return res.data;
  },
  finalizeExam: async (examId: number) => {
    const res = await client.post(`/exams/${examId}/finalize`);
    return res.data;
  }
};

export const analyticsService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await client.get('/analytics/dashboard');
    return res.data;
  },
  getTopicAnalytics: async (): Promise<TopicAnalytics[]> => {
    const res = await client.get('/analytics/topics');
    return res.data;
  },
  getWeaknessReport: async (): Promise<WeaknessReport> => {
    const res = await client.get('/analytics/weakness');
    return res.data;
  }
};

export const adminService = {
  createQuestion: async (qData: any) => {
    const res = await client.post('/admin/questions', qData);
    return res.data;
  },
  updateQuestion: async (id: number, qData: any) => {
    const res = await client.put(`/admin/questions/${id}`, qData);
    return res.data;
  },
  deleteQuestion: async (id: number) => {
    const res = await client.delete(`/admin/questions/${id}`);
    return res.data;
  },
  exportQuestions: async () => {
    const res = await client.get('/admin/export-questions');
    return res.data;
  },
  importQuestions: async (payload: any) => {
    const res = await client.post('/admin/import-questions', payload);
    return res.data;
  }
};
