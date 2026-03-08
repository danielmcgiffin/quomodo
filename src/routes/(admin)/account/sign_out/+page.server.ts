import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session } = await safeGetSession()

  if (session) {
    await supabase.auth.signOut()
  }

  redirect(303, "/login/sign_in")
}
