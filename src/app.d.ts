import { Session, SupabaseClient, type AMREntry } from "@supabase/supabase-js"
import { Database } from "./DatabaseDefinitions"

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      requestId?: string
      supabase: SupabaseClient<Database>
      supabaseServiceRole: SupabaseClient<Database>
      orgContext?: {
        orgId: string
        orgName: string
        membershipRole: "owner" | "admin" | "editor" | "member"
        userId: string
      }
      orgContextPromise?: Promise<{
        orgId: string
        orgName: string
        membershipRole: "owner" | "admin" | "editor" | "member"
        userId: string
      }>
      safeGetSession: () => Promise<{
        session: Session | null
        user: User | null
        amr: AMREntry[] | null
      }>
      session: Session | null
      user: User | null
    }
    interface PageData {
      session: Session | null
    }
    // interface Error {}
    // interface Platform {}
  }
}

export {}
