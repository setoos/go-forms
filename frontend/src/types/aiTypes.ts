import { Database } from './supabase';

export type FormTier = 'capture' | 'learn' | 'engage' | 'strategize' | 'convert';

export type FormType = 'contact' | 'survey' | 'quiz' | 'assessment' | 'transaction';

export type EvaluationMode = 'none' | 'simple' | 'ai-assisted' | 'weighted' | 'dynamic';

export type QuestionType = 
  | 'short-text' 
  | 'long-text' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'date' 
  | 'time'
  | 'multiple-choice' 
  | 'checkbox' 
  | 'dropdown' 
  | 'rating-scale'
  | 'likert-scale'
  | 'slider'
  | 'matrix'
  | 'file-upload'
  | 'voice-input'
  | 'price'
  | 'quantity'
  | 'unit';

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
  correct_answer?: string | string[];
  ai_prompt?: string;
  max_score?: number;
  sample_answer?: string;
  weight?: number;
  category?: string;
  price?: number;
  unit?: string;
  min_quantity?: number;
  max_quantity?: number;
  order: number;
  logic?: FormLogic[];
}

export interface FormLogic {
  condition: {
    questionId: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
  };
  action: {
    type: 'show' | 'hide' | 'skip_to' | 'set_value';
    target: string;
    value?: any;
  };
}

export interface FormOutput {
  type: 'message' | 'redirect' | 'summary' | 'score' | 'pdf' | 'email' | 'invoice';
  template: string;
  conditions?: {
    scoreRange?: [number, number];
    categories?: string[];
    customLogic?: string;
  };
  content?: {
    title?: string;
    body?: string;
    footer?: string;
    branding?: boolean;
  };
}

export interface Form {
  id: string;
  title: string;
  description: string;
  type: FormType;
  tier: FormTier;
  evaluation_mode: EvaluationMode;
  questions: Question[];
  logic?: FormLogic[];
  outputs?: FormOutput[];
  settings: {
    requireIdentity: boolean;
    enableBranching: boolean;
    enableScoring: boolean;
    enableAI: boolean;
    enableVoice: boolean;
    enableWebhooks: boolean;
    customBranding?: {
      logo?: string;
      colors?: {
        primary: string;
        secondary: string;
      };
    };
  };
  integrations?: {
    crm?: string;
    webhook?: string;
    payment?: string;
    calendar?: string;
  };
  analytics: {
    views: number;
    submissions: number;
    completionRate: number;
    averageScore?: number;
    conversionRate?: number;
  };
  created_at: Date;
  updated_at: Date;
  is_template: boolean;
  sharing_enabled: boolean;
  share_link?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  forms: Form[];
  templates: Form[];
}

export interface FormResponse {
  id: string;
  formId: string;
  userId?: string;
  identity?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  answers: {
    questionId: string;
    value: string | string[] | number;
  }[];
  score?: number;
  categories?: Record<string, number>;
  feedback?: string;
  output?: FormOutput;
  submittedAt: Date;
}