export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      quizzes: {
        Row: {
          id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          is_published: boolean
          category: string | null
          time_limit: number | null
          passing_score: number | null
          status: string
          deleted_at: string | null
          completion_count: number
          average_score: number
          version: number
          approval_status: string
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          last_published_at: string | null
          published_version: number | null
          share_id: string | null
          start_date: string | null
          end_date: string | null
          max_attempts: number | null
          access_type: string
          password_hash: string | null
          requires_auth: boolean
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          is_published?: boolean
          category?: string | null
          time_limit?: number | null
          passing_score?: number | null
          status?: string
          deleted_at?: string | null
          completion_count?: number
          average_score?: number
          version?: number
          approval_status?: string
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          last_published_at?: string | null
          published_version?: number | null
          share_id?: string | null
          start_date?: string | null
          end_date?: string | null
          max_attempts?: number | null
          access_type?: string
          password_hash?: string | null
          requires_auth?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          is_published?: boolean
          category?: string | null
          time_limit?: number | null
          passing_score?: number | null
          status?: string
          deleted_at?: string | null
          completion_count?: number
          average_score?: number
          version?: number
          approval_status?: string
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          last_published_at?: string | null
          published_version?: number | null
          share_id?: string | null
          start_date?: string | null
          end_date?: string | null
          max_attempts?: number | null
          access_type?: string
          password_hash?: string | null
          requires_auth?: boolean
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}