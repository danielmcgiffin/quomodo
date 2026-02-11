import {
  processBySlug,
  actionsByProcessId,
  roleById,
  systemById,
  flags,
} from "$lib/data/atlas"

import { error } from "@sveltejs/kit"

export const load = ({ params }) => {
  const process = processBySlug.get(params.slug)
  if (!process) {
    throw error(404, "Process not found")
  }

  const actions = (actionsByProcessId.get(process.id) ?? []).map((action) => ({
    ...action,
    ownerRole: roleById.get(action.ownerRoleId)!,
    system: systemById.get(action.systemId)!,
  }))
  const roles = Array.from(
    new Set([process.ownerRoleId, ...actions.map((action) => action.ownerRoleId)]),
  )
    .map((id) => roleById.get(id))
    .filter(Boolean)
  const systems = Array.from(new Set(actions.map((action) => action.systemId)))
    .map((id) => systemById.get(id))
    .filter(Boolean)
  const processFlags = flags.filter(
    (flag) => flag.targetType === "process" && flag.targetId === process.id,
  )

  return {
    process,
    actions,
    roles,
    systems,
    processFlags,
  }
}
