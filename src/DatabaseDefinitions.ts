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
      contact_requests: {
        Row: {
          company_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          message_body: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          message_body?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          message_body?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          full_name: string | null
          id: string
          unsubscribed: boolean
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          full_name?: string | null
          id: string
          unsubscribed?: boolean
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          full_name?: string | null
          id?: string
          unsubscribed?: boolean
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          stripe_customer_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          stripe_customer_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          stripe_customer_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orgs: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      org_members: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: Database["public"]["Enums"]["sc_membership_role"]
          invited_at: string
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role?: Database["public"]["Enums"]["sc_membership_role"]
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["sc_membership_role"]
          invited_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          org_id: string
          slug: string
          name: string
          description_rich: Json
          person_name: string | null
          hours_per_week: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          slug: string
          name: string
          description_rich?: Json
          person_name?: string | null
          hours_per_week?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          slug?: string
          name?: string
          description_rich?: Json
          person_name?: string | null
          hours_per_week?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      systems: {
        Row: {
          id: string
          org_id: string
          slug: string
          name: string
          description_rich: Json
          location: string | null
          url: string | null
          owner_role_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          slug: string
          name: string
          description_rich?: Json
          location?: string | null
          url?: string | null
          owner_role_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          slug?: string
          name?: string
          description_rich?: Json
          location?: string | null
          url?: string | null
          owner_role_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          id: string
          org_id: string
          slug: string
          name: string
          description_rich: Json
          trigger: string | null
          end_state: string | null
          owner_role_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          slug: string
          name: string
          description_rich?: Json
          trigger?: string | null
          end_state?: string | null
          owner_role_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          slug?: string
          name?: string
          description_rich?: Json
          trigger?: string | null
          end_state?: string | null
          owner_role_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      actions: {
        Row: {
          id: string
          org_id: string
          process_id: string
          sequence: number
          description_rich: Json
          owner_role_id: string
          system_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          process_id: string
          sequence: number
          description_rich?: Json
          owner_role_id: string
          system_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          process_id?: string
          sequence?: number
          description_rich?: Json
          owner_role_id?: string
          system_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_system_access: {
        Row: {
          id: string
          org_id: string
          role_id: string
          system_id: string
          access_level: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          role_id: string
          system_id: string
          access_level?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          role_id?: string
          system_id?: string
          access_level?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      flags: {
        Row: {
          id: string
          org_id: string
          target_type: Database["public"]["Enums"]["sc_entity_type"]
          target_id: string
          target_path: string | null
          flag_type: Database["public"]["Enums"]["sc_flag_type"]
          message: string
          created_by: string
          created_at: string
          status: Database["public"]["Enums"]["sc_flag_status"]
          resolved_by: string | null
          resolved_at: string | null
          resolution_note: string | null
        }
        Insert: {
          id?: string
          org_id: string
          target_type: Database["public"]["Enums"]["sc_entity_type"]
          target_id: string
          target_path?: string | null
          flag_type: Database["public"]["Enums"]["sc_flag_type"]
          message: string
          created_by?: string
          created_at?: string
          status?: Database["public"]["Enums"]["sc_flag_status"]
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_note?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          target_type?: Database["public"]["Enums"]["sc_entity_type"]
          target_id?: string
          target_path?: string | null
          flag_type?: Database["public"]["Enums"]["sc_flag_type"]
          message?: string
          created_by?: string
          created_at?: string
          status?: Database["public"]["Enums"]["sc_flag_status"]
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_note?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      sc_entity_type: "role" | "system" | "process" | "action"
      sc_flag_status: "open" | "resolved" | "dismissed"
      sc_flag_type: "stale" | "incorrect" | "needs_review" | "question" | "comment"
      sc_membership_role: "owner" | "admin" | "editor" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
