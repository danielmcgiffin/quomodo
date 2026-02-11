import {
  roleBySlug,
  processById,
  processes,
  actions,
  systemById,
  flags,
  roleById,
} from "$lib/data/atlas"
import { error } from "@sveltejs/kit"

export const load = ({ params }) => {
  const role = roleBySlug.get(params.slug)
  if (!role) {
    throw error(404, "Role not found")
  }

  const ownedProcesses = processes.filter(
    (process) => process.ownerRoleId === role.id,
  )

  const actionsPerformed = actions
    .filter((action) => action.ownerRoleId === role.id)
    .map((action) => ({
      ...action,
      system: systemById.get(action.systemId)!,
    }))

  const systemsAccessed = Array.from(
    new Set(actionsPerformed.map((action) => action.systemId)),
  )
    .map((id) => systemById.get(id))
    .filter(Boolean)

  const actionsByProcess = ownedProcesses.map((process) => ({
    process,
    actions: actionsPerformed.filter((action) => action.processId === process.id),
  }))

  const roleFlags = flags.filter(
    (flag) => flag.targetType === "role" && flag.targetId === role.id,
  )

  const reportsTo = role.reportsTo ? roleById.get(role.reportsTo) : null

  return {
    role,
    ownedProcesses,
    actionsPerformed,
    systemsAccessed,
    actionsByProcess,
    roleFlags,
    reportsTo,
  }
}
