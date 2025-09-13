export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      badge_progress: {
        Row: {
          avg_rating: number
          avg_response_time_hours: number
          created_at: string
          current_streak_weeks: number
          id: string
          last_session_date: string | null
          student_improvement_score: number
          total_sessions: number
          total_stress_reduction: number
          tutor_id: string
          updated_at: string
        }
        Insert: {
          avg_rating?: number
          avg_response_time_hours?: number
          created_at?: string
          current_streak_weeks?: number
          id?: string
          last_session_date?: string | null
          student_improvement_score?: number
          total_sessions?: number
          total_stress_reduction?: number
          tutor_id: string
          updated_at?: string
        }
        Update: {
          avg_rating?: number
          avg_response_time_hours?: number
          created_at?: string
          current_streak_weeks?: number
          id?: string
          last_session_date?: string | null
          student_improvement_score?: number
          total_sessions?: number
          total_stress_reduction?: number
          tutor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_text: string | null
          last_message_time: string | null
          student_id: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_text?: string | null
          last_message_time?: string | null
          student_id: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_text?: string | null
          last_message_time?: string | null
          student_id?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      "courses-20251": {
        Row: {
          "Course number": string
          "Course title": string | null
          Instructor: string | null
        }
        Insert: {
          "Course number": string
          "Course title"?: string | null
          Instructor?: string | null
        }
        Update: {
          "Course number"?: string
          "Course title"?: string | null
          Instructor?: string | null
        }
        Relationships: []
      }
      "courses-20252": {
        Row: {
          "Course number": string
          "Course title": string | null
          Instructor: string | null
        }
        Insert: {
          "Course number": string
          "Course title"?: string | null
          Instructor?: string | null
        }
        Update: {
          "Course number"?: string
          "Course title"?: string | null
          Instructor?: string | null
        }
        Relationships: []
      }
      "courses-20253": {
        Row: {
          "Course number": string
          "Course title": string | null
          Instructor: string | null
        }
        Insert: {
          "Course number": string
          "Course title"?: string | null
          Instructor?: string | null
        }
        Update: {
          "Course number"?: string
          "Course title"?: string | null
          Instructor?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          booking_notifications: boolean
          created_at: string
          id: string
          new_messages: boolean
          platform_updates: boolean
          resource_updates: boolean
          session_reminders: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_notifications?: boolean
          created_at?: string
          id?: string
          new_messages?: boolean
          platform_updates?: boolean
          resource_updates?: boolean
          session_reminders?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_notifications?: boolean
          created_at?: string
          id?: string
          new_messages?: boolean
          platform_updates?: boolean
          resource_updates?: boolean
          session_reminders?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          environment: string | null
          id: string
          payment_completed_at: string | null
          payment_link_id: string | null
          payment_link_url: string | null
          platform_fee: number | null
          session_id: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          student_id: string | null
          tutor_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          environment?: string | null
          id?: string
          payment_completed_at?: string | null
          payment_link_id?: string | null
          payment_link_url?: string | null
          platform_fee?: number | null
          session_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          tutor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          environment?: string | null
          id?: string
          payment_completed_at?: string | null
          payment_link_id?: string | null
          payment_link_url?: string | null
          platform_fee?: number | null
          session_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          tutor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          attrs: Json | null
          created: string | null
          currency: string | null
          description: string | null
          fee: number | null
          id: string | null
          net: number | null
          status: string | null
          type: string | null
        }
        Insert: {
          amount?: number | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          description?: string | null
          fee?: number | null
          id?: string | null
          net?: number | null
          status?: string | null
          type?: string | null
        }
        Update: {
          amount?: number | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          description?: string | null
          fee?: number | null
          id?: string | null
          net?: number | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      pending_transfers: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          last_retry_at: string | null
          payment_intent_id: string | null
          payment_transaction_id: string | null
          platform_fee: number | null
          processed_at: string | null
          processor: string | null
          retry_count: number | null
          session_id: string | null
          status: string
          student_id: string
          transfer_group: string | null
          transfer_id: string | null
          tutor_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          last_retry_at?: string | null
          payment_intent_id?: string | null
          payment_transaction_id?: string | null
          platform_fee?: number | null
          processed_at?: string | null
          processor?: string | null
          retry_count?: number | null
          session_id?: string | null
          status?: string
          student_id: string
          transfer_group?: string | null
          transfer_id?: string | null
          tutor_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          last_retry_at?: string | null
          payment_intent_id?: string | null
          payment_transaction_id?: string | null
          platform_fee?: number | null
          processed_at?: string | null
          processor?: string | null
          retry_count?: number | null
          session_id?: string | null
          status?: string
          student_id?: string
          transfer_group?: string | null
          transfer_id?: string | null
          tutor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pending_transfers_payment"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pending_transfers_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_transfers_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_tutor: boolean | null
          availability: Json | null
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          created_at: string
          first_name: string | null
          graduation_year: string | null
          hourly_rate: number | null
          id: string
          last_name: string | null
          major: string | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_connect_id: string | null
          stripe_connect_onboarding_complete: boolean | null
          subjects: string[] | null
          updated_at: string
        }
        Insert: {
          approved_tutor?: boolean | null
          availability?: Json | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          first_name?: string | null
          graduation_year?: string | null
          hourly_rate?: number | null
          id: string
          last_name?: string | null
          major?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_connect_id?: string | null
          stripe_connect_onboarding_complete?: boolean | null
          subjects?: string[] | null
          updated_at?: string
        }
        Update: {
          approved_tutor?: boolean | null
          availability?: Json | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          first_name?: string | null
          graduation_year?: string | null
          hourly_rate?: number | null
          id?: string
          last_name?: string | null
          major?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_connect_id?: string | null
          stripe_connect_onboarding_complete?: boolean | null
          subjects?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          accepted_at: string | null
          actual_end_time: string | null
          actual_start_time: string | null
          completion_date: string | null
          completion_method:
            | Database["public"]["Enums"]["completion_method"]
            | null
          course_id: string | null
          created_at: string
          end_time: string
          id: string
          location: string | null
          notes: string | null
          payment_status: string | null
          reminder_1h_sent_at: string | null
          reminder_24h_sent_at: string | null
          session_type: string | null
          start_time: string
          status: Database["public"]["Enums"]["session_status"] | null
          student_confirmed: boolean | null
          student_id: string
          tutor_confirmed: boolean | null
          tutor_id: string
          updated_at: string
          zoom_created_at: string | null
          zoom_join_url: string | null
          zoom_meeting_id: string | null
          zoom_password: string | null
          zoom_start_url: string | null
          zoom_updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          actual_end_time?: string | null
          actual_start_time?: string | null
          completion_date?: string | null
          completion_method?:
            | Database["public"]["Enums"]["completion_method"]
            | null
          course_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          location?: string | null
          notes?: string | null
          payment_status?: string | null
          reminder_1h_sent_at?: string | null
          reminder_24h_sent_at?: string | null
          session_type?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["session_status"] | null
          student_confirmed?: boolean | null
          student_id: string
          tutor_confirmed?: boolean | null
          tutor_id: string
          updated_at?: string
          zoom_created_at?: string | null
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
          zoom_password?: string | null
          zoom_start_url?: string | null
          zoom_updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          actual_end_time?: string | null
          actual_start_time?: string | null
          completion_date?: string | null
          completion_method?:
            | Database["public"]["Enums"]["completion_method"]
            | null
          course_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          location?: string | null
          notes?: string | null
          payment_status?: string | null
          reminder_1h_sent_at?: string | null
          reminder_24h_sent_at?: string | null
          session_type?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["session_status"] | null
          student_confirmed?: boolean | null
          student_id?: string
          tutor_confirmed?: boolean | null
          tutor_id?: string
          updated_at?: string
          zoom_created_at?: string | null
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
          zoom_password?: string | null
          zoom_start_url?: string | null
          zoom_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_reviews: {
        Row: {
          came_prepared: number | null
          comfortable_asking_questions:
            | Database["public"]["Enums"]["comfortable_asking_questions"]
            | null
          confidence_improvement: number | null
          created_at: string
          emotional_support: number | null
          engagement_level: number | null
          felt_judged: boolean | null
          learning_anxiety_reduction: number | null
          motivation_effort: number | null
          overall_wellbeing_impact: number | null
          respectful: number | null
          review_id: string
          session_id: string
          stress_after: number | null
          stress_before: number | null
          student_id: string
          student_showed_up: boolean | null
          subject_clarity: number | null
          teaching_quality: number | null
          tutor_feedback: string | null
          tutor_id: string
          tutor_showed_up: boolean
          updated_at: string
          would_book_again: boolean | null
          written_feedback: string | null
        }
        Insert: {
          came_prepared?: number | null
          comfortable_asking_questions?:
            | Database["public"]["Enums"]["comfortable_asking_questions"]
            | null
          confidence_improvement?: number | null
          created_at?: string
          emotional_support?: number | null
          engagement_level?: number | null
          felt_judged?: boolean | null
          learning_anxiety_reduction?: number | null
          motivation_effort?: number | null
          overall_wellbeing_impact?: number | null
          respectful?: number | null
          review_id?: string
          session_id: string
          stress_after?: number | null
          stress_before?: number | null
          student_id: string
          student_showed_up?: boolean | null
          subject_clarity?: number | null
          teaching_quality?: number | null
          tutor_feedback?: string | null
          tutor_id: string
          tutor_showed_up: boolean
          updated_at?: string
          would_book_again?: boolean | null
          written_feedback?: string | null
        }
        Update: {
          came_prepared?: number | null
          comfortable_asking_questions?:
            | Database["public"]["Enums"]["comfortable_asking_questions"]
            | null
          confidence_improvement?: number | null
          created_at?: string
          emotional_support?: number | null
          engagement_level?: number | null
          felt_judged?: boolean | null
          learning_anxiety_reduction?: number | null
          motivation_effort?: number | null
          overall_wellbeing_impact?: number | null
          respectful?: number | null
          review_id?: string
          session_id?: string
          stress_after?: number | null
          stress_before?: number | null
          student_id?: string
          student_showed_up?: boolean | null
          subject_clarity?: number | null
          teaching_quality?: number | null
          tutor_feedback?: string | null
          tutor_id?: string
          tutor_showed_up?: boolean
          updated_at?: string
          would_book_again?: boolean | null
          written_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_reviews_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          code: string
          created_at: string
          id: string
          is_current: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_current?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_current?: boolean | null
          name?: string
        }
        Relationships: []
      }
      tutor_availability: {
        Row: {
          availability: Json | null
          created_at: string
          id: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          availability?: Json | null
          created_at?: string
          id?: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          availability?: Json | null
          created_at?: string
          id?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tutor_badges: {
        Row: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at: string
          criteria_met: Json | null
          earned_date: string
          id: string
          is_active: boolean
          tutor_id: string
          updated_at: string
        }
        Insert: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at?: string
          criteria_met?: Json | null
          earned_date?: string
          id?: string
          is_active?: boolean
          tutor_id: string
          updated_at?: string
        }
        Update: {
          badge_type?: Database["public"]["Enums"]["badge_type"]
          created_at?: string
          criteria_met?: Json | null
          earned_date?: string
          id?: string
          is_active?: boolean
          tutor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tutor_courses: {
        Row: {
          course_number: string
          course_title: string | null
          created_at: string
          department: string | null
          id: string
          tutor_id: string
        }
        Insert: {
          course_number: string
          course_title?: string | null
          created_at?: string
          department?: string | null
          id?: string
          tutor_id: string
        }
        Update: {
          course_number?: string
          course_title?: string | null
          created_at?: string
          department?: string | null
          id?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_courses_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_student_courses: {
        Row: {
          course_number: string
          course_title: string | null
          created_at: string
          department: string | null
          id: string
          user_id: string
        }
        Insert: {
          course_number: string
          course_title?: string | null
          created_at?: string
          department?: string | null
          id?: string
          user_id: string
        }
        Update: {
          course_number?: string
          course_title?: string | null
          created_at?: string
          department?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_students: {
        Row: {
          active: boolean
          created_at: string
          id: string
          student_id: string
          tutor_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          student_id: string
          tutor_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          student_id?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_students_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_tutor: {
        Args: { tutor_id: string }
        Returns: undefined
      }
      award_badges_for_tutor: {
        Args: { input_tutor_id: string }
        Returns: undefined
      }
      check_column_exists: {
        Args: { column_name: string; table_name: string }
        Returns: boolean
      }
      execute_sql: {
        Args: { sql: string }
        Returns: undefined
      }
      list_term_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          term_code: string
        }[]
      }
      retroactive_badge_award: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      badge_type:
        | "founding_tutor"
        | "weekly_streak"
        | "top_rated"
        | "sessions_50"
        | "sessions_100"
        | "student_success_champion"
        | "quick_responder"
        | "industry_professional"
        | "advanced_degree"
        | "superstar"
      comfortable_asking_questions: "very" | "somewhat" | "not_at_all"
      completion_method:
        | "auto"
        | "manual_both"
        | "manual_student"
        | "manual_tutor"
      session_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      user_role: "student" | "tutor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      badge_type: [
        "founding_tutor",
        "weekly_streak",
        "top_rated",
        "sessions_50",
        "sessions_100",
        "student_success_champion",
        "quick_responder",
        "industry_professional",
        "advanced_degree",
        "superstar",
      ],
      comfortable_asking_questions: ["very", "somewhat", "not_at_all"],
      completion_method: [
        "auto",
        "manual_both",
        "manual_student",
        "manual_tutor",
      ],
      session_status: ["scheduled", "in_progress", "completed", "cancelled"],
      user_role: ["student", "tutor"],
    },
  },
} as const
