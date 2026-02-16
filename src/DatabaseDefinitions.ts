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
      org_invites: {
        Row: {
          id: string
          org_id: string
          email: string
          role: Database["public"]["Enums"]["sc_membership_role"]
          token_hash: string
          invited_by_user_id: string
          revoked_by_user_id: string | null
          accepted_by_user_id: string | null
          org_member_id: string | null
          expires_at: string
          revoked_at: string | null
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          email: string
          role?: Database["public"]["Enums"]["sc_membership_role"]
          token_hash: string
          invited_by_user_id: string
          revoked_by_user_id?: string | null
          accepted_by_user_id?: string | null
          org_member_id?: string | null
          expires_at?: string
          revoked_at?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          email?: string
          role?: Database["public"]["Enums"]["sc_membership_role"]
          token_hash?: string
          invited_by_user_id?: string
          revoked_by_user_id?: string | null
          accepted_by_user_id?: string | null
          org_member_id?: string | null
          expires_at?: string
          revoked_at?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      org_ownership_transfers: {
        Row: {
          id: string
          org_id: string
          token_hash: string
          from_owner_id: string
          to_owner_id: string
          initiated_by_user_id: string
          prior_owner_role_after:
            | Database["public"]["Enums"]["sc_membership_role"]
            | null
          prior_owner_leave: boolean
          status: Database["public"]["Enums"]["sc_ownership_transfer_status"]
          expires_at: string
          created_at: string
          accepted_at: string | null
          accepted_by_user_id: string | null
          cancelled_at: string | null
          cancelled_by_user_id: string | null
        }
        Insert: {
          id?: string
          org_id: string
          token_hash: string
          from_owner_id: string
          to_owner_id: string
          initiated_by_user_id: string
          prior_owner_role_after?:
            | Database["public"]["Enums"]["sc_membership_role"]
            | null
          prior_owner_leave?: boolean
          status?: Database["public"]["Enums"]["sc_ownership_transfer_status"]
          expires_at: string
          created_at?: string
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          cancelled_at?: string | null
          cancelled_by_user_id?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          token_hash?: string
          from_owner_id?: string
          to_owner_id?: string
          initiated_by_user_id?: string
          prior_owner_role_after?:
            | Database["public"]["Enums"]["sc_membership_role"]
            | null
          prior_owner_leave?: boolean
          status?: Database["public"]["Enums"]["sc_ownership_transfer_status"]
          expires_at?: string
          created_at?: string
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          cancelled_at?: string | null
          cancelled_by_user_id?: string | null
        }
        Relationships: []
      }
      org_billing: {
        Row: {
          org_id: string
          stripe_customer_id: string | null
          plan_id: string
          billing_state: Database["public"]["Enums"]["sc_billing_state"]
          has_ever_paid: boolean
          last_checked_at: string | null
          updated_at: string
        }
        Insert: {
          org_id: string
          stripe_customer_id?: string | null
          plan_id?: string
          billing_state?: Database["public"]["Enums"]["sc_billing_state"]
          has_ever_paid?: boolean
          last_checked_at?: string | null
          updated_at?: string
        }
        Update: {
          org_id?: string
          stripe_customer_id?: string | null
          plan_id?: string
          billing_state?: Database["public"]["Enums"]["sc_billing_state"]
          has_ever_paid?: boolean
          last_checked_at?: string | null
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
          reports_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          slug: string
          name: string
          description_rich?: Json
          reports_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          slug?: string
          name?: string
          description_rich?: Json
          reports_to?: string | null
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
          location: string
          owner_role_id: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          slug: string
          name: string
          description_rich?: Json
          location?: string
          owner_role_id?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          slug?: string
          name?: string
          description_rich?: Json
          location?: string
          owner_role_id?: string | null
          logo_url?: string | null
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
          trigger: string
          end_state: string
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
          trigger: string
          end_state: string
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
          trigger?: string
          end_state?: string
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
      search_all: {
        Row: {
          entity_type: Database["public"]["Enums"]["sc_entity_type"]
          id: string
          org_id: string
          slug: string | null
          title: string
          body: string
        }
        Relationships: []
      }
    }
    Functions: {
      sc_accept_ownership_transfer: {
        Args: {
          p_token_hash: string
        }
        Returns: string
      }
      sc_cancel_ownership_transfer: {
        Args: {
          p_org_id: string
        }
        Returns: undefined
      }
      sc_create_ownership_transfer: {
        Args: {
          p_org_id: string
          p_to_user_id: string
          p_token_hash: string
          p_prior_owner_disposition: string
          p_expires_at: string
        }
        Returns: string
      }
    }
    Enums: {
      sc_billing_state: "active" | "lapsed"
      sc_entity_type: "role" | "system" | "process" | "action"
      sc_flag_status: "open" | "resolved" | "dismissed"
      sc_flag_type:
        | "stale"
        | "incorrect"
        | "needs_review"
        | "question"
        | "comment"
      sc_ownership_transfer_status: "pending" | "accepted" | "cancelled"
      sc_membership_role: "owner" | "admin" | "editor" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
