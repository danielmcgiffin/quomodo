import {
  systemBySlug,
  actions,
  processById,
  roleById,
  flags,
} from "$lib/data/atlas"
import { error } from "@sveltejs/kit"

export const load = ({ params }) => {
  const system = systemBySlug.get(params.slug)
  if (!system) {
    throw error(404, "System not found")
  }

  const actionsUsing = actions
    .filter((action) => action.systemId === system.id)
    .map((action) => ({
      ...action,
      ownerRole: roleById.get(action.ownerRoleId)!,
    }))
  const processesUsing = Array.from(
    new Set(actionsUsing.map((action) => action.processId)),
  )
    .map((id) => processById.get(id))
    .filter(Boolean)
  const rolesUsing = Array.from(
    new Set(actionsUsing.map((action) => action.ownerRoleId)),
  )
    .map((id) => roleById.get(id))
    .filter(Boolean)

  const systemFlags = flags.filter(
    (flag) => flag.targetType === "system" && flag.targetId === system.id,
  )

  return {
    system,
    actionsUsing,
    processesUsing,
    rolesUsing,
    systemFlags,
  }
}
