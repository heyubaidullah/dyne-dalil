/**
 * Replace this with output from:
 *   npx supabase gen types typescript --project-id <id> --schema public > src/lib/supabase/types.ts
 *
 * Until then, `Database` is a loose placeholder so clients type-check against real tables.
 */
export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner: string | null;
          created_at: string;
          audience_group: string | null;
          product_category: string | null;
          main_goal: string | null;
          preferred_focus: string | null;
          team_size: number | null;
          company_notes: string | null;
          onboarding_completed_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner?: string | null;
          created_at?: string;
          audience_group?: string | null;
          product_category?: string | null;
          main_goal?: string | null;
          preferred_focus?: string | null;
          team_size?: number | null;
          company_notes?: string | null;
          onboarding_completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
        Relationships: [];
      };
      signals: {
        Row: {
          id: string;
          workspace_id: string;
          title: string | null;
          source_type: string | null;
          raw_text: string;
          created_at: string;
          feedback_type: string | null;
          category: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title?: string | null;
          source_type?: string | null;
          raw_text: string;
          created_at?: string;
          feedback_type?: string | null;
          category?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["signals"]["Insert"]>;
        Relationships: [];
      };
      signal_analyses: {
        Row: {
          id: string;
          signal_id: string;
          ai_summary: string | null;
          founder_notes: string | null;
          confirmed_summary: string | null;
          positive_feedback: string[] | null;
          negative_feedback: string[] | null;
          pain_points: string[] | null;
          objections: string[] | null;
          requests: string[] | null;
          urgency: string | null;
          likely_segment: string | null;
          quotes: string[] | null;
          confidence: string | null;
          embedding: number[] | null;
          created_at: string;
          confirmed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["signal_analyses"]["Row"]> & {
          signal_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["signal_analyses"]["Insert"]>;
        Relationships: [];
      };
      decisions: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          category: string | null;
          rationale: string | null;
          expected_outcome: string | null;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["decisions"]["Row"]> & {
          workspace_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["decisions"]["Insert"]>;
        Relationships: [];
      };
      decision_evidence: {
        Row: {
          decision_id: string;
          signal_id: string;
          snippet: string | null;
        };
        Insert: {
          decision_id: string;
          signal_id: string;
          snippet?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["decision_evidence"]["Insert"]>;
        Relationships: [];
      };
      outcomes: {
        Row: {
          id: string;
          decision_id: string;
          status: "improved" | "failed" | "inconclusive" | "pending";
          notes: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["outcomes"]["Row"]> & {
          decision_id: string;
          status: "improved" | "failed" | "inconclusive" | "pending";
        };
        Update: Partial<Database["public"]["Tables"]["outcomes"]["Insert"]>;
        Relationships: [];
      };
      ideas: {
        Row: {
          id: string;
          transcript_summary: string | null;
          approved_idea: string | null;
          audience: string | null;
          problem_statement: string | null;
          converted_workspace_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ideas"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["ideas"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_signal_analyses: {
        Args: {
          query_embedding: number[];
          workspace_filter: string;
          match_count?: number;
        };
        Returns: {
          id: string;
          signal_id: string;
          confirmed_summary: string | null;
          similarity: number;
        }[];
      };
      match_decisions: {
        Args: {
          query_embedding: number[];
          workspace_filter: string;
          match_count?: number;
        };
        Returns: {
          id: string;
          title: string;
          rationale: string | null;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
};
