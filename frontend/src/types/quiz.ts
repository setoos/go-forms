export type QuestionType = 
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'short_answer'
  | 'matching'
  | 'ordering'
  | 'essay'
  | 'picture_based'
  | 'complete_statement'
  | 'definition';

export interface Quiz {
  id?: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  time_limit?: number | null;
  passing_score?: number | null;
  status?: 'draft' | 'published' | 'archived';
  version?: number;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  last_published_at?: string | null;
  published_version?: number | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  is_published?: boolean;
  deleted_at?: string | null;
  completion_count?: number;
  average_score?: number;
  share_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  max_attempts?: number | null;
  access_type?: 'public' | 'private' | 'invite';
  password_hash?: string | null;
  requires_auth?: boolean;
}

export interface Question {
  id: string;
  quiz_id: string;
  text: string;
  type: QuestionType;
  order: number;
  instructions?: string;
  points: number;
  metadata?: any;
  correct_answer?: string;
  answer_key?: any;
  rubric?: any;
  validation_rules?: any;
  media_url?: string;
  cognitive_level?: 'recall' | 'understanding' | 'application' | 'analysis';
  difficulty_level?: 'easy' | 'medium' | 'hard';
  time_limit?: number;
  required: boolean;
  created_at: string;
  options?: Option[];
  matching_pairs?: MatchingPair[];
  ordering_items?: OrderingItem[];
  essay_rubrics?: EssayRubric[];
}

export interface Option {
  id: string;
  question_id: string;
  text: string;
  score: number;
  feedback: string | null;
  order: number;
  is_correct: boolean;
}

export interface MatchingPair {
  id: string;
  question_id: string;
  left_item: string;
  right_item: string;
  order: number;
  created_at: string;
}

export interface OrderingItem {
  id: string;
  question_id: string;
  item: string;
  correct_position: number;
  order: number;
  created_at: string;
}

export interface EssayRubric {
  id: string;
  question_id: string;
  criteria: string;
  description: string | null;
  max_points: number;
  created_at: string;
}

export interface QuizResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  answers: Record<string, number>;
  score: number;
  quiz_id: string;
  completion_time: number | null;
  timestamp: string;
  custom_feedback?: string;
}

export interface QuizState {
  currentQuestion: number;
  answers: Record<string, any>;
  startTime?: number;
  userInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface QuizFilters {
  status?: 'draft' | 'published' | 'archived';
  category?: string;
  search?: string;
  sortBy?: 'created_at' | 'title' | 'completion_count' | 'average_score';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

export const QUIZ_CATEGORIES = [
  'Marketing',
  'Technology',
  'Business',
  'Education',
  'Science',
  'General Knowledge',
  'Other'
] as const;

export type QuizCategory = typeof QUIZ_CATEGORIES[number];

export const QUIZ_STATUSES = {
  draft: {
    label: 'Draft',
    color: 'yellow'
  },
  published: {
    label: 'Published',
    color: 'green'
  },
  archived: {
    label: 'Archived',
    color: 'gray'
  }
} as const;

export const ACCESS_TYPES = {
  public: {
    label: 'Public',
    description: 'Anyone can access this quiz'
  },
  private: {
    label: 'Private',
    description: 'Only people with the link can access'
  },
  invite: {
    label: 'Invite Only',
    description: 'Only invited participants can access'
  }
} as const;

export interface QuizAnalytics {
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  completionRate: number;
  averageTimeSpent: number;
  questionAnalytics: QuestionAnalytics[];
  recentAttempts: RecentAttempt[];
}

export interface QuestionAnalytics {
  id: string;
  text: string;
  correctRate: number;
  averageTimeSpent: number;
  answerDistribution: Record<string, number>;
}

export interface RecentAttempt {
  id: string;
  participant_name: string;
  participant_email: string;
  score: number;
  started_at: string;
  completed_at: string;
}

export interface QuizShare {
  id: string;
  quiz_id: string;
  share_id: string;
  created_at: string;
  expires_at: string | null;
  access_type: 'public' | 'private' | 'invite';
  password_hash: string | null;
  max_attempts: number | null;
  created_by: string;
}