export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      authors: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      book_authors: {
        Row: {
          author_id: string;
          book_id: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          author_id: string;
          book_id: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          author_id?: string;
          book_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'book_authors_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'authors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'book_authors_book_id_fkey';
            columns: ['book_id'];
            isOneToOne: false;
            referencedRelation: 'books';
            referencedColumns: ['id'];
          },
        ];
      };
      books: {
        Row: {
          api_id: string | null;
          api_source: string | null;
          cover_image_url: string | null;
          created_at: string | null;
          date_added: string | null;
          description: string | null;
          edition: Json | null;
          format: Database['public']['Enums']['book_format_enum'] | null;
          genres: string[] | null;
          id: string;
          isbn10: string | null;
          isbn13: string | null;
          language: string | null;
          metadata: Json | null;
          publication_date: string | null;
          publisher: string | null;
          rating: number | null;
          title: string;
          total_duration: number | null;
          total_pages: number | null;
          updated_at: string | null;
        };
        Insert: {
          api_id?: string | null;
          api_source?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          date_added?: string | null;
          description?: string | null;
          edition?: Json | null;
          format?: Database['public']['Enums']['book_format_enum'] | null;
          genres?: string[] | null;
          id: string;
          isbn10?: string | null;
          isbn13?: string | null;
          language?: string | null;
          metadata?: Json | null;
          publication_date?: string | null;
          publisher?: string | null;
          rating?: number | null;
          title: string;
          total_duration?: number | null;
          total_pages?: number | null;
          updated_at?: string | null;
        };
        Update: {
          api_id?: string | null;
          api_source?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          date_added?: string | null;
          description?: string | null;
          edition?: Json | null;
          format?: Database['public']['Enums']['book_format_enum'] | null;
          genres?: string[] | null;
          id?: string;
          isbn10?: string | null;
          isbn13?: string | null;
          language?: string | null;
          metadata?: Json | null;
          publication_date?: string | null;
          publisher?: string | null;
          rating?: number | null;
          title?: string;
          total_duration?: number | null;
          total_pages?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      csv_export_logs: {
        Row: {
          created_at: string | null;
          exported_at: string;
          id: string;
          record_count: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          exported_at?: string;
          id?: string;
          record_count?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          exported_at?: string;
          id?: string;
          record_count?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'csv_export_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      deadline_notes: {
        Row: {
          created_at: string | null;
          deadline_id: string;
          deadline_progress: number;
          id: string;
          note_text: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          deadline_id: string;
          deadline_progress: number;
          id?: string;
          note_text: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          deadline_id?: string;
          deadline_progress?: number;
          id?: string;
          note_text?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'deadline_notes_deadline_id_fkey';
            columns: ['deadline_id'];
            isOneToOne: false;
            referencedRelation: 'deadlines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deadline_notes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      deadline_progress: {
        Row: {
          created_at: string;
          current_progress: number;
          deadline_id: string;
          id: string;
          ignore_in_calcs: boolean;
          time_spent_reading: number | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_progress?: number;
          deadline_id: string;
          id?: string;
          ignore_in_calcs?: boolean;
          time_spent_reading?: number | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_progress?: number;
          deadline_id?: string;
          id?: string;
          ignore_in_calcs?: boolean;
          time_spent_reading?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'deadline_progress_deadline_id_fkey';
            columns: ['deadline_id'];
            isOneToOne: false;
            referencedRelation: 'deadlines';
            referencedColumns: ['id'];
          },
        ];
      };
      deadline_status: {
        Row: {
          created_at: string;
          deadline_id: string | null;
          id: string;
          status: Database['public']['Enums']['deadline_status_enum'] | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deadline_id?: string | null;
          id?: string;
          status?: Database['public']['Enums']['deadline_status_enum'] | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deadline_id?: string | null;
          id?: string;
          status?: Database['public']['Enums']['deadline_status_enum'] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'deadline_status_deadline_id_fkey';
            columns: ['deadline_id'];
            isOneToOne: false;
            referencedRelation: 'deadlines';
            referencedColumns: ['id'];
          },
        ];
      };
      deadlines: {
        Row: {
          author: string | null;
          book_id: string | null;
          book_title: string;
          created_at: string;
          deadline_date: string;
          flexibility: Database['public']['Enums']['deadline_flexibility'];
          format: Database['public']['Enums']['book_format_enum'];
          id: string;
          source: string;
          total_quantity: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          author?: string | null;
          book_id?: string | null;
          book_title: string;
          created_at?: string;
          deadline_date: string;
          flexibility: Database['public']['Enums']['deadline_flexibility'];
          format: Database['public']['Enums']['book_format_enum'];
          id?: string;
          source: string;
          total_quantity: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          author?: string | null;
          book_id?: string | null;
          book_title?: string;
          created_at?: string;
          deadline_date?: string;
          flexibility?: Database['public']['Enums']['deadline_flexibility'];
          format?: Database['public']['Enums']['book_format_enum'];
          id?: string;
          source?: string;
          total_quantity?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'deadlines_book_id_fkey';
            columns: ['book_id'];
            isOneToOne: false;
            referencedRelation: 'books';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deadlines_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          onboarding_complete: boolean | null;
          role: Database['public']['Enums']['user_role'] | null;
          updated_at: string | null;
          username: string | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          onboarding_complete?: boolean | null;
          role?: Database['public']['Enums']['user_role'] | null;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          onboarding_complete?: boolean | null;
          role?: Database['public']['Enums']['user_role'] | null;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      review_platforms: {
        Row: {
          created_at: string | null;
          id: string;
          platform_name: string;
          posted: boolean | null;
          posted_date: string | null;
          review_tracking_id: string;
          review_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          platform_name: string;
          posted?: boolean | null;
          posted_date?: string | null;
          review_tracking_id: string;
          review_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          platform_name?: string;
          posted?: boolean | null;
          posted_date?: string | null;
          review_tracking_id?: string;
          review_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'review_platforms_review_tracking_id_fkey';
            columns: ['review_tracking_id'];
            isOneToOne: false;
            referencedRelation: 'review_tracking';
            referencedColumns: ['id'];
          },
        ];
      };
      review_tracking: {
        Row: {
          all_reviews_complete: boolean | null;
          created_at: string | null;
          deadline_id: string;
          id: string;
          needs_link_submission: boolean | null;
          review_due_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          all_reviews_complete?: boolean | null;
          created_at?: string | null;
          deadline_id: string;
          id?: string;
          needs_link_submission?: boolean | null;
          review_due_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          all_reviews_complete?: boolean | null;
          created_at?: string | null;
          deadline_id?: string;
          id?: string;
          needs_link_submission?: boolean | null;
          review_due_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'review_tracking_deadline_id_fkey';
            columns: ['deadline_id'];
            isOneToOne: true;
            referencedRelation: 'deadlines';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activities: {
        Row: {
          activity_data: Json | null;
          activity_type: string;
          id: string;
          timestamp: string | null;
          user_id: string | null;
        };
        Insert: {
          activity_data?: Json | null;
          activity_type: string;
          id?: string;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Update: {
          activity_data?: Json | null;
          activity_type?: string;
          id?: string;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_searches: {
        Row: {
          created_at: string | null;
          id: string;
          query: string;
          result_count: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          query: string;
          result_count: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          query?: string;
          result_count?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_searches_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_prefixed_id: {
        Args: { prefix: string };
        Returns: string;
      };
      get_reading_notes_csv: {
        Args: { p_user_id: string };
        Returns: {
          book_title: string;
          created_at: string;
          deadline_id: string;
          note_text: string;
          updated_at: string;
        }[];
      };
      get_reading_progress_csv: {
        Args: { p_user_id: string };
        Returns: {
          author: string;
          book_title: string;
          completed_date: string;
          created_date: string;
          current_progress: number;
          days_remaining: number;
          deadline_date: string;
          flexibility: string;
          format: string;
          last_progress_update: string;
          pages_per_day_needed: number;
          source: string;
          status: string;
          total_quantity: number;
          unit: string;
        }[];
      };
      store_book_with_authors: {
        Args: { book_data: Json };
        Returns: string;
      };
    };
    Enums: {
      book_format_enum: 'physical' | 'eBook' | 'audio';
      deadline_flexibility: 'flexible' | 'strict';
      deadline_status_enum:
        | 'pending'
        | 'reading'
        | 'to_review'
        | 'complete'
        | 'did_not_finish';
      user_role: 'user' | 'admin' | 'super-admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      book_format_enum: ['physical', 'eBook', 'audio'],
      deadline_flexibility: ['flexible', 'strict'],
      deadline_status_enum: [
        'pending',
        'reading',
        'to_review',
        'complete',
        'did_not_finish',
      ],
      user_role: ['user', 'admin', 'super-admin'],
    },
  },
} as const;
