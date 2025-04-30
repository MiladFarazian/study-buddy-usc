export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          charge_id: string | null
          created_at: string | null
          id: string
          payment_intent_status: string | null
          payment_type: string | null
          platform_fee: number | null
          requires_transfer: boolean | null
          session_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          student_id: string | null
          transfer_id: string | null
          transfer_status: string | null
          tutor_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          charge_id?: string | null
          created_at?: string | null
          id?: string
          payment_intent_status?: string | null
          payment_type?: string | null
          platform_fee?: number | null
          requires_transfer?: boolean | null
          session_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          transfer_id?: string | null
          transfer_status?: string | null
          tutor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          charge_id?: string | null
          created_at?: string | null
          id?: string
          payment_intent_status?: string | null
          payment_type?: string | null
          platform_fee?: number | null
          requires_transfer?: boolean | null
          session_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          transfer_id?: string | null
          transfer_status?: string | null
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
          payment_intent_id: string | null
          payment_transaction_id: string | null
          platform_fee: number | null
          processed_at: string | null
          processor: string | null
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
          payment_intent_id?: string | null
          payment_transaction_id?: string | null
          platform_fee?: number | null
          processed_at?: string | null
          processor?: string | null
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
          payment_intent_id?: string | null
          payment_transaction_id?: string | null
          platform_fee?: number | null
          processed_at?: string | null
          processor?: string | null
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
          course_id: string | null
          created_at: string
          end_time: string
          id: string
          location: string | null
          notes: string | null
          payment_status: string | null
          start_time: string
          status: string
          student_id: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          location?: string | null
          notes?: string | null
          payment_status?: string | null
          start_time: string
          status?: string
          student_id: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          location?: string | null
          notes?: string | null
          payment_status?: string | null
          start_time?: string
          status?: string
          student_id?: string
          tutor_id?: string
          updated_at?: string
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
      check_column_exists: {
        Args: { table_name: string; column_name: string }
        Returns: boolean
      }
      execute_sql: {
        Args: { sql: string }
        Returns: undefined
      }
      list_term_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          term_code: string
          table_name: string
        }[]
      }
    }
    Enums: {
      user_role: "student" | "tutor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["student", "tutor"],
    },
  },
} as const
