export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      book_notes: {
        Row: {
          book_id: string
          content: string
          created_at: string
          id: string
          page: number | null
          user_id: string
        }
        Insert: {
          book_id: string
          content: string
          created_at?: string
          id?: string
          page?: number | null
          user_id: string
        }
        Update: {
          book_id?: string
          content?: string
          created_at?: string
          id?: string
          page?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_notes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string | null
          cover_url: string | null
          created_at: string
          current_page: number
          finished_on: string | null
          id: string
          is_public: boolean
          isbn13: string | null
          rating: number | null
          started_on: string | null
          status: string
          title: string
          total_pages: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          cover_url?: string | null
          created_at?: string
          current_page?: number
          finished_on?: string | null
          id?: string
          is_public?: boolean
          isbn13?: string | null
          rating?: number | null
          started_on?: string | null
          status?: string
          title: string
          total_pages?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          cover_url?: string | null
          created_at?: string
          current_page?: number
          finished_on?: string | null
          id?: string
          is_public?: boolean
          isbn13?: string | null
          rating?: number | null
          started_on?: string | null
          status?: string
          title?: string
          total_pages?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      certificate_tags: {
        Row: {
          certificate_id: string
          tag_id: string
        }
        Insert: {
          certificate_id: string
          tag_id: string
        }
        Update: {
          certificate_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_tags_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          created_at: string
          credential_id: string | null
          expires_on: string | null
          file_mime: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          institution: string | null
          is_public: boolean
          issued_on: string | null
          title: string
          updated_at: string
          user_id: string
          verification_url: string | null
          workload_hours: number | null
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          expires_on?: string | null
          file_mime?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          institution?: string | null
          is_public?: boolean
          issued_on?: string | null
          title: string
          updated_at?: string
          user_id: string
          verification_url?: string | null
          workload_hours?: number | null
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          expires_on?: string | null
          file_mime?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          institution?: string | null
          is_public?: boolean
          issued_on?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          verification_url?: string | null
          workload_hours?: number | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          certificate_id: string | null
          created_at: string
          finished_on: string | null
          id: string
          is_public: boolean
          platform: string | null
          progress_pct: number
          started_on: string | null
          status: string
          title: string
          updated_at: string
          url: string | null
          user_id: string
          workload_hours: number | null
        }
        Insert: {
          certificate_id?: string | null
          created_at?: string
          finished_on?: string | null
          id?: string
          is_public?: boolean
          platform?: string | null
          progress_pct?: number
          started_on?: string | null
          status?: string
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          workload_hours?: number | null
        }
        Update: {
          certificate_id?: string | null
          created_at?: string
          finished_on?: string | null
          id?: string
          is_public?: boolean
          platform?: string | null
          progress_pct?: number
          started_on?: string | null
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          workload_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
        ]
      }
      curricula: {
        Row: {
          created_at: string
          id: string
          institution: string
          program: string
          required_credits: number | null
          required_elective_credits: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution: string
          program: string
          required_credits?: number | null
          required_elective_credits?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution?: string
          program?: string
          required_credits?: number | null
          required_elective_credits?: number | null
          user_id?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          created_at: string
          grade: number | null
          id: string
          status: string
          subject_id: string
          term: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grade?: number | null
          id?: string
          status?: string
          subject_id: string
          term: string
          user_id: string
        }
        Update: {
          created_at?: string
          grade?: number | null
          id?: string
          status?: string
          subject_id?: string
          term?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      github_connections: {
        Row: {
          encrypted_token: string
          github_login: string
          synced_at: string | null
          user_id: string
        }
        Insert: {
          encrypted_token: string
          github_login: string
          synced_at?: string | null
          user_id: string
        }
        Update: {
          encrypted_token?: string
          github_login?: string
          synced_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      github_repos: {
        Row: {
          description: string | null
          full_name: string
          html_url: string
          id: string
          is_private: boolean
          is_public: boolean
          language: string | null
          name: string
          open_issues: number
          open_prs: number
          pushed_at: string | null
          repo_id: number
          stars: number
          synced_at: string
          user_id: string
        }
        Insert: {
          description?: string | null
          full_name: string
          html_url: string
          id?: string
          is_private?: boolean
          is_public?: boolean
          language?: string | null
          name: string
          open_issues?: number
          open_prs?: number
          pushed_at?: string | null
          repo_id: number
          stars?: number
          synced_at?: string
          user_id: string
        }
        Update: {
          description?: string | null
          full_name?: string
          html_url?: string
          id?: string
          is_private?: boolean
          is_public?: boolean
          language?: string | null
          name?: string
          open_issues?: number
          open_prs?: number
          pushed_at?: string | null
          repo_id?: number
          stars?: number
          synced_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      mission_logs: {
        Row: {
          completed_at: string | null
          due_on: string
          id: string
          mission_id: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          due_on: string
          id?: string
          mission_id: string
          status: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          due_on?: string
          id?: string
          mission_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_logs_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          course_id: string | null
          created_at: string
          due_on: string | null
          enrollment_id: string | null
          id: string
          is_active: boolean
          kind: string
          notes: string | null
          roadmap_step_id: string | null
          source: string
          title: string
          user_id: string
          weekdays: number[]
          xp_reward: number
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          due_on?: string | null
          enrollment_id?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          notes?: string | null
          roadmap_step_id?: string | null
          source?: string
          title: string
          user_id: string
          weekdays?: number[]
          xp_reward?: number
        }
        Update: {
          course_id?: string | null
          created_at?: string
          due_on?: string | null
          enrollment_id?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          notes?: string | null
          roadmap_step_id?: string | null
          source?: string
          title?: string
          user_id?: string
          weekdays?: number[]
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "missions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_enrollment_fk"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_roadmap_step_id_fkey"
            columns: ["roadmap_step_id"]
            isOneToOne: false
            referencedRelation: "roadmap_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_public: boolean
          locale: string
          timezone: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_public?: boolean
          locale?: string
          timezone?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_public?: boolean
          locale?: string
          timezone?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reading_goals: {
        Row: {
          target_books: number
          user_id: string
          year: number
        }
        Insert: {
          target_books: number
          user_id: string
          year: number
        }
        Update: {
          target_books?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          book_id: string
          id: string
          page: number
          read_on: string
          user_id: string
        }
        Insert: {
          book_id: string
          id?: string
          page: number
          read_on: string
          user_id: string
        }
        Update: {
          book_id?: string
          id?: string
          page?: number
          read_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_steps: {
        Row: {
          course_id: string | null
          description: string | null
          done_at: string | null
          id: string
          position: number
          roadmap_id: string
          status: string
          title: string
        }
        Insert: {
          course_id?: string | null
          description?: string | null
          done_at?: string | null
          id?: string
          position: number
          roadmap_id: string
          status?: string
          title: string
        }
        Update: {
          course_id?: string | null
          description?: string | null
          done_at?: string | null
          id?: string
          position?: number
          roadmap_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_steps_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_steps_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          created_at: string
          goal: string | null
          id: string
          is_active: boolean
          target_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal?: string | null
          id?: string
          is_active?: boolean
          target_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal?: string | null
          id?: string
          is_active?: boolean
          target_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_slots: {
        Row: {
          ends_at: string
          enrollment_id: string
          id: string
          starts_at: string
          user_id: string
          weekday: number
        }
        Insert: {
          ends_at: string
          enrollment_id: string
          id?: string
          starts_at: string
          user_id: string
          weekday: number
        }
        Update: {
          ends_at?: string
          enrollment_id?: string
          id?: string
          starts_at?: string
          user_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_slots_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_relations: {
        Row: {
          kind: string
          related_id: string
          subject_id: string
        }
        Insert: {
          kind: string
          related_id: string
          subject_id: string
        }
        Update: {
          kind?: string
          related_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_relations_related_id_fkey"
            columns: ["related_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_relations_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          credits: number
          curriculum_id: string
          hours: number | null
          id: string
          kind: string
          name: string
          suggested_term: number | null
        }
        Insert: {
          code: string
          credits?: number
          curriculum_id: string
          hours?: number | null
          id?: string
          kind?: string
          name: string
          suggested_term?: number | null
        }
        Update: {
          code?: string
          credits?: number
          curriculum_id?: string
          hours?: number | null
          id?: string
          kind?: string
          name?: string
          suggested_term?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          current_streak: number
          last_closed_on: string | null
          longest_streak: number
          shield_week: string | null
          shields: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          current_streak?: number
          last_closed_on?: string | null
          longest_streak?: number
          shield_week?: string | null
          shields?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          current_streak?: number
          last_closed_on?: string | null
          longest_streak?: number
          shield_week?: string | null
          shields?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      academic_summary: {
        Args: { p_curriculum_id: string }
        Returns: {
          earned_credits: number
          gpa: number
          progress_pct: number
          required_credits: number
        }[]
      }
      available_subjects: {
        Args: { p_curriculum_id: string }
        Returns: {
          code: string
          credits: number
          name: string
          subject_id: string
          unlocks: number
        }[]
      }
      is_profile_public: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

