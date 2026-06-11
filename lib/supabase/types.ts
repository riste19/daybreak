// Auto-generated Supabase types (matches database schema)
// Generated from: migrations/001_initial_schema.sql

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string; // must be the Supabase Auth user id (no auto-generate)
          email: string;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          status: 'trial' | 'active' | 'cancelled';
          plan: string;
          trial_started_at: string | null;
          trial_ends_at: string | null;
          subscription_started_at: string | null;
          subscription_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: 'trial' | 'active' | 'cancelled';
          plan?: string;
          trial_started_at?: string | null;
          trial_ends_at?: string | null;
          subscription_started_at?: string | null;
          subscription_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: 'trial' | 'active' | 'cancelled';
          plan?: string;
          trial_started_at?: string | null;
          trial_ends_at?: string | null;
          subscription_started_at?: string | null;
          subscription_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          tone: string;
          send_time: string;
          primary_goal: string | null;
          custom_notes: string | null;
          preferred_themes: Json;
          focus_categories: Json;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tone?: string;
          send_time?: string;
          primary_goal?: string | null;
          custom_notes?: string | null;
          preferred_themes?: Json;
          focus_categories?: Json;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tone?: string;
          send_time?: string;
          primary_goal?: string | null;
          custom_notes?: string | null;
          preferred_themes?: Json;
          focus_categories?: Json;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      generated_emails: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          body: string;
          theme: string;
          sent_at: string;
          used_fallback: boolean;
          generation_input: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          body: string;
          theme: string;
          sent_at: string;
          used_fallback?: boolean;
          generation_input?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          body?: string;
          theme?: string;
          sent_at?: string;
          used_fallback?: boolean;
          generation_input?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'generated_emails_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          note: string | null;
          created_at: string;
          claimed_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          note?: string | null;
          created_at?: string;
          claimed_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          note?: string | null;
          created_at?: string;
          claimed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_status: 'trial' | 'active' | 'cancelled';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

public type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database }
    | { name: keyof (Database['public']['Tables'] & Database['public']['Views']) },
  TableName extends PublicTableNameOrOptions extends { name: infer P } ? P : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
    Database['public']['Views'])
    ? PublicTableNameOrOptions
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] & {
      Row: Database[PublicTableNameOrOptions['schema']]['Tables'][TableName]['Row'];
      Insert: Database[PublicTableNameOrOptions['schema']]['Tables'][TableName]['Insert'];
      Update: Database[PublicTableNameOrOptions['schema']]['Tables'][TableName]['Update'];
      Relationships: Database[PublicTableNameOrOptions['schema']]['Tables'][TableName]['Relationships'];
    }
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] & Database['public']['Views'])
    ? (Database['public']['Tables'] & Database['public']['Views'])[PublicTableNameOrOptions] & {
        Row: (Database['public']['Tables'] & Database['public']['Views'])[PublicTableNameOrOptions]['Row'];
        Insert: (Database['public']['Tables'] & Database['public']['Views'])[PublicTableNameOrOptions]['Insert'];
        Update: (Database['public']['Tables'] & Database['public']['Views'])[PublicTableNameOrOptions]['Update'];
        Relationships: (Database['public']['Tables'] & Database['public']['Views'])[PublicTableNameOrOptions]['Relationships'];
      }
    : never;
