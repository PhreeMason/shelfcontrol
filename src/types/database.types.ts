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
          google_volume_id: string | null;
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
          google_volume_id?: string | null;
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
          google_volume_id?: string | null;
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
      deadline_contacts: {
        Row: {
          contact_name: string | null;
          created_at: string;
          deadline_id: string;
          email: string | null;
          id: string;
          updated_at: string;
          user_id: string;
          username: string | null;
        };
        Insert: {
          contact_name?: string | null;
          created_at?: string;
          deadline_id: string;
          email?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
          username?: string | null;
        };
        Update: {
          contact_name?: string | null;
          created_at?: string;
          deadline_id?: string;
          email?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'deadline_contacts_deadline_id_fkey';
            columns: ['deadline_id'];
            isOneToOne: false;
            referencedRelation: 'deadlines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deadline_contacts_user_id_fkey';
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
      deadline_tags: {
        Row: {
          created_at: string;
          deadline_id: string;
          id: string;
          tag_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deadline_id: string;
          id?: string;
          tag_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deadline_id?: string;
          id?: string;
          tag_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'deadline_tags_deadline_id_fkey';
            columns: ['deadline_id'];
            isOneToOne: false;
            referencedRelation: 'deadlines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deadline_tags_tag_id_fkey';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'tags';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deadline_tags_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      deadlines: {
        Row: {
          acquisition_source: string | null;
          author: string | null;
          book_id: string | null;
          book_title: string;
          cover_image_url: string | null;
          created_at: string;
          deadline_date: string;
          deadline_type: string | null;
          disclosure_source_name: string | null;
          disclosure_template_id: string | null;
          disclosure_text: string | null;
          flexibility: Database['public']['Enums']['deadline_flexibility'];
          format: Database['public']['Enums']['book_format_enum'];
          id: string;
          publishers: string[] | null;
          source: string | null;
          total_quantity: number;
          type: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          acquisition_source?: string | null;
          author?: string | null;
          book_id?: string | null;
          book_title: string;
          cover_image_url?: string | null;
          created_at?: string;
          deadline_date: string;
          deadline_type?: string | null;
          disclosure_source_name?: string | null;
          disclosure_template_id?: string | null;
          disclosure_text?: string | null;
          flexibility: Database['public']['Enums']['deadline_flexibility'];
          format: Database['public']['Enums']['book_format_enum'];
          id?: string;
          publishers?: string[] | null;
          source?: string | null;
          total_quantity: number;
          type?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          acquisition_source?: string | null;
          author?: string | null;
          book_id?: string | null;
          book_title?: string;
          cover_image_url?: string | null;
          created_at?: string;
          deadline_date?: string;
          deadline_type?: string | null;
          disclosure_source_name?: string | null;
          disclosure_template_id?: string | null;
          disclosure_text?: string | null;
          flexibility?: Database['public']['Enums']['deadline_flexibility'];
          format?: Database['public']['Enums']['book_format_enum'];
          id?: string;
          publishers?: string[] | null;
          source?: string | null;
          total_quantity?: number;
          type?: string | null;
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
            foreignKeyName: 'deadlines_disclosure_template_id_fkey';
            columns: ['disclosure_template_id'];
            isOneToOne: false;
            referencedRelation: 'disclosure_templates';
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
      disclosure_templates: {
        Row: {
          created_at: string;
          disclosure_text: string;
          id: string;
          source_name: string;
          template_name: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          disclosure_text: string;
          id: string;
          source_name: string;
          template_name?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          disclosure_text?: string;
          id?: string;
          source_name?: string;
          template_name?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'disclosure_templates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      hashtags: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color: string;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'hashtags_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      note_hashtags: {
        Row: {
          created_at: string;
          hashtag_id: string;
          id: string;
          note_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          hashtag_id: string;
          id?: string;
          note_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          hashtag_id?: string;
          id?: string;
          note_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'note_hashtags_hashtag_id_fkey';
            columns: ['hashtag_id'];
            isOneToOne: false;
            referencedRelation: 'hashtags';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'note_hashtags_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'deadline_notes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'note_hashtags_user_id_fkey';
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
          role: Database['public']['Enums']['user_role_enum'] | null;
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
          role?: Database['public']['Enums']['user_role_enum'] | null;
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
          role?: Database['public']['Enums']['user_role_enum'] | null;
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
      tags: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          color: string;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tags_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
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
          search_source: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          query: string;
          result_count: number;
          search_source?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          query?: string;
          result_count?: number;
          search_source?: string | null;
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
      user_settings: {
        Row: {
          created_at: string | null;
          id: string;
          preferences: Json;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          preferences?: Json;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          preferences?: Json;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
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
      generate_prefixed_id: { Args: { prefix: string }; Returns: string };
      get_activity_types_over_time: {
        Args: {
          p_days?: number;
          p_exclude_user_ids?: string[];
          p_user_ids?: string[];
        };
        Returns: {
          activity_date: string;
          activity_type: string;
          count: number;
        }[];
      };
      get_daily_activities: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string };
        Returns: {
          activity_date: string;
          activity_timestamp: string;
          activity_type: string;
          book_title: string;
          deadline_id: string;
          metadata: Json;
        }[];
      };
      get_deadline_status_breakdown: {
        Args: { p_exclude_user_ids?: string[]; p_user_ids?: string[] };
        Returns: {
          count: number;
          status: string;
        }[];
      };
      get_format_distribution: {
        Args: { p_exclude_user_ids?: string[]; p_user_ids?: string[] };
        Returns: {
          count: number;
          format: string;
        }[];
      };
      get_most_active_users_today: {
        Args: {
          p_exclude_user_ids?: string[];
          p_limit?: number;
          p_tz?: string;
        };
        Returns: {
          activity_count: number;
          avatar_url: string;
          email: string;
          first_name: string;
          last_name: string;
          user_id: string;
          username: string;
          yesterday_rank: number;
        }[];
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
          acquisition_source: string;
          all_reviews_complete: boolean;
          author: string;
          book_title: string;
          completed_date: string;
          contact_email: string;
          contact_name: string;
          contact_username: string;
          created_date: string;
          current_progress: number;
          deadline_date: string;
          disclosure_source_name: string;
          disclosure_text: string;
          flexibility: string;
          format: string;
          last_progress_update: string;
          needs_link_submission: boolean;
          publishers: string;
          review_due_date: string;
          status: string;
          tags: string;
          total_quantity: number;
          type: string;
          unit: string;
        }[];
      };
      get_review_platforms_csv: {
        Args: { p_user_id: string };
        Returns: {
          book_title: string;
          deadline_id: string;
          platform_name: string;
          posted: boolean;
          posted_date: string;
          review_url: string;
        }[];
      };
      get_top_books: {
        Args: { p_limit?: number };
        Returns: {
          book_id: string;
          cover_image_url: string;
          deadline_count: number;
          title: string;
          yesterday_rank: number;
        }[];
      };
      get_top_deadline_users: {
        Args: { p_limit?: number };
        Returns: {
          avatar_url: string;
          deadline_count: number;
          email: string;
          first_name: string;
          last_name: string;
          user_id: string;
          username: string;
          yesterday_rank: number;
        }[];
      };
      get_top_pages_read_today:
        | {
            Args: {
              p_exclude_user_ids?: string[];
              p_limit?: number;
              p_tz?: string;
            };
            Returns: {
              avatar_url: string;
              email: string;
              first_name: string;
              last_name: string;
              pages_read: number;
              user_id: string;
              username: string;
              yesterday_rank: number;
            }[];
          }
        | {
            Args: { p_exclude_user_ids?: string[]; p_limit?: number };
            Returns: {
              avatar_url: string;
              email: string;
              first_name: string;
              last_name: string;
              pages_read: number;
              user_id: string;
              username: string;
            }[];
          }
        | {
            Args: { p_exclude_user_ids?: string[]; p_limit?: number };
            Returns: {
              avatar_url: string;
              email: string;
              first_name: string;
              last_name: string;
              pages_read: number;
              user_id: string;
              username: string;
            }[];
          };
      store_book_with_authors: { Args: { book_data: Json }; Returns: string };
    };
    Enums: {
      book_format_enum: 'physical' | 'eBook' | 'audio';
      deadline_flexibility: 'flexible' | 'strict';
      deadline_status_enum:
        | 'applied'
        | 'pending'
        | 'reading'
        | 'paused'
        | 'to_review'
        | 'complete'
        | 'rejected'
        | 'withdrew'
        | 'did_not_finish';
      user_role_enum: 'user' | 'admin' | 'super-admin' | 'alpha' | 'beta';
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
        'applied',
        'pending',
        'reading',
        'paused',
        'to_review',
        'complete',
        'rejected',
        'withdrew',
        'did_not_finish',
      ],
      user_role_enum: ['user', 'admin', 'super-admin', 'alpha', 'beta'],
    },
  },
} as const;
