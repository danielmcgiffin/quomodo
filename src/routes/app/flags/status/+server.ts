import { json } from "@sveltejs/kit"
import { canModerateFlags, ensureOrgContext } from "$lib/server/atlas"

export const POST = async ({ locals, request }) => {
  const context = await ensureOrgContext(locals)

  if (!canModerateFlags(context.membershipRole)) {
    return json({ error: "Insufficient permissions." }, { status: 403 })
  }

  const payload = (await request.json().catch(() => null)) as {
    id?: string
    action?: "resolve" | "dismiss"
    resolutionNote?: string
  } | null

  const id = String(payload?.id ?? "").trim()
  const action = payload?.action

  if (!id || (action !== "resolve" && action !== "dismiss")) {
    return json({ error: "Invalid flag update." }, { status: 400 })
  }

  const resolutionNote = String(payload?.resolutionNote ?? "").trim()

  const updatePayload =
    action === "resolve"
      ? {
          status: "resolved" as const,
          resolved_at: new Date().toISOString(),
          resolved_by: context.userId,
          resolution_note: resolutionNote || null,
        }
      : {
          status: "dismissed" as const,
          resolved_at: new Date().toISOString(),
          resolved_by: context.userId,
        }

  const { error } = await locals.supabase
    .from("flags")
    .update(updatePayload)
    .eq("id", id)
    .eq("org_id", context.orgId)

  if (error) {
    return json({ error: error.message }, { status: 400 })
  }

  return json({ ok: true })
}
