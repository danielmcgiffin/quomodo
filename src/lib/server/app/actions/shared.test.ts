import { describe, expect, it, vi } from "vitest"
import {
  createFlagForEntity,
  createRoleRecord,
  createSystemRecord,
  deleteRoleRecord,
  deleteSystemRecord,
  updateRoleRecord,
  updateSystemRecord,
} from "./shared"

const createTargetLookupChain = (data: { id: string } | null, error = null) => {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.maybeSingle.mockResolvedValue({ data, error })
  return chain
}

const createRoleLookupChain = (data: { id: string; slug?: string } | null) => {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.maybeSingle.mockResolvedValue({ data, error: null })
  return chain
}

const createSystemLookupChain = (data: { id: string; slug?: string } | null) => {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.maybeSingle.mockResolvedValue({ data, error: null })
  return chain
}

const createUpdateChain = (error: { message: string } | null = null) => {
  const chain = {
    update: vi.fn(),
    eq: vi.fn(),
  }
  chain.update.mockReturnValue(chain)
  chain.eq.mockReturnValueOnce(chain)
  chain.eq.mockResolvedValueOnce({ error })
  return chain
}

const createCountChain = ({
  count,
  error = null,
}: {
  count: number
  error?: { message: string } | null
}) => {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValueOnce(chain)
  chain.eq.mockResolvedValueOnce({ count, error })
  return chain
}

const createDeleteChain = (error: { message: string } | null = null) => {
  const chain = {
    delete: vi.fn(),
    eq: vi.fn(),
  }
  chain.delete.mockReturnValue(chain)
  chain.eq.mockReturnValueOnce(chain)
  chain.eq.mockResolvedValueOnce({ error })
  return chain
}

describe("shared app actions", () => {
  it("rejects role creation when role name is missing", async () => {
    const result = await createRoleRecord({
      supabase: {} as App.Locals["supabase"],
      orgId: "org-1",
      draft: {
        name: "",
        description: "x",
        personName: "",
        hoursRaw: "",
      },
    })

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Role name is required.",
    })
  })

  it("rejects role creation when hours are non-numeric", async () => {
    const result = await createRoleRecord({
      supabase: {} as App.Locals["supabase"],
      orgId: "org-1",
      draft: {
        name: "Operator",
        description: "x",
        personName: "",
        hoursRaw: "abc",
      },
    })

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Hours per week must be numeric.",
    })
  })

  it("rejects system creation when name is missing", async () => {
    const result = await createSystemRecord({
      supabase: {} as App.Locals["supabase"],
      orgId: "org-1",
      draft: {
        name: "",
        description: "",
        location: "",
        url: "",
        ownerRoleIdRaw: "",
      },
    })

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "System name is required.",
    })
  })

  it("rejects system update when system id is missing", async () => {
    const result = await updateSystemRecord({
      supabase: {} as App.Locals["supabase"],
      orgId: "org-1",
      systemId: "",
      draft: {
        name: "CRM",
        description: "",
        location: "",
        url: "",
        ownerRoleIdRaw: "",
      },
    })

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "System id is required.",
    })
  })

  it("rejects role update when role id is missing", async () => {
    const result = await updateRoleRecord({
      supabase: {} as App.Locals["supabase"],
      orgId: "org-1",
      roleId: "",
      draft: {
        name: "Ops Manager",
        description: "",
        personName: "",
        hoursRaw: "",
      },
    })

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Role id is required.",
    })
  })

  it("rejects role update when hours are non-numeric", async () => {
    const result = await updateRoleRecord({
      supabase: {} as App.Locals["supabase"],
      orgId: "org-1",
      roleId: "role-1",
      draft: {
        name: "Ops Manager",
        description: "",
        personName: "",
        hoursRaw: "forty",
      },
    })

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Hours per week must be numeric.",
    })
  })

  it("blocks role deletion when actions still reference the role", async () => {
    let rolesCall = 0
    const roleLookup = createRoleLookupChain({ id: "role-1" })
    const actionCountChain = createCountChain({ count: 2 })
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "roles") {
          rolesCall += 1
          return roleLookup
        }
        if (table === "actions") {
          return actionCountChain
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as App.Locals["supabase"]

    const result = await deleteRoleRecord({
      supabase,
      orgId: "org-1",
      roleId: "role-1",
    })

    expect(result).toEqual({
      ok: false,
      status: 409,
      message: "Cannot delete role while 2 actions are assigned to it.",
    })
    expect(rolesCall).toBe(1)
  })

  it("updates a role when inputs are valid", async () => {
    let rolesCall = 0
    const roleLookup = createRoleLookupChain({ id: "role-1", slug: "ops" })
    const roleUpdate = createUpdateChain(null)
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "roles") {
          rolesCall += 1
          return rolesCall === 1 ? roleLookup : roleUpdate
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as App.Locals["supabase"]

    const result = await updateRoleRecord({
      supabase,
      orgId: "org-1",
      roleId: "role-1",
      draft: {
        name: "Operations Lead",
        description: "Owns operations",
        personName: "Taylor",
        hoursRaw: "40",
      },
    })

    expect(result).toEqual({
      ok: true,
      id: "role-1",
      slug: "ops",
    })
    expect(roleUpdate.update).toHaveBeenCalledWith({
      name: "Operations Lead",
      description_rich: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Owns operations" }],
          },
        ],
      },
      person_name: "Taylor",
      hours_per_week: 40,
    })
  })

  it("deletes a role when it has no assigned actions", async () => {
    let rolesCall = 0
    const roleLookup = createRoleLookupChain({ id: "role-1" })
    const roleDelete = createDeleteChain(null)
    const actionCountChain = createCountChain({ count: 0 })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "roles") {
          rolesCall += 1
          return rolesCall === 1 ? roleLookup : roleDelete
        }
        if (table === "actions") {
          return actionCountChain
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as App.Locals["supabase"]

    const result = await deleteRoleRecord({
      supabase,
      orgId: "org-1",
      roleId: "role-1",
    })

    expect(result).toEqual({ ok: true })
    expect(roleDelete.delete).toHaveBeenCalled()
  })

  it("updates a system when inputs are valid", async () => {
    let systemsCall = 0
    const systemLookup = createSystemLookupChain({
      id: "system-1",
      slug: "hubspot",
    })
    const systemUpdate = createUpdateChain(null)
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "systems") {
          systemsCall += 1
          return systemsCall === 1 ? systemLookup : systemUpdate
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as App.Locals["supabase"]

    const result = await updateSystemRecord({
      supabase,
      orgId: "org-1",
      systemId: "system-1",
      draft: {
        name: "HubSpot CRM",
        description: "Customer records",
        location: "sales",
        url: "https://app.hubspot.com",
        ownerRoleIdRaw: "role-9",
      },
    })

    expect(result).toEqual({
      ok: true,
      id: "system-1",
      slug: "hubspot",
    })
    expect(systemUpdate.update).toHaveBeenCalledWith({
      name: "HubSpot CRM",
      description_rich: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Customer records" }],
          },
        ],
      },
      location: "sales",
      url: "https://app.hubspot.com",
      owner_role_id: "role-9",
    })
  })

  it("blocks system deletion when actions still reference the system", async () => {
    let systemsCall = 0
    const systemLookup = createSystemLookupChain({ id: "system-1" })
    const actionCountChain = createCountChain({ count: 3 })
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "systems") {
          systemsCall += 1
          return systemLookup
        }
        if (table === "actions") {
          return actionCountChain
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as App.Locals["supabase"]

    const result = await deleteSystemRecord({
      supabase,
      orgId: "org-1",
      systemId: "system-1",
    })

    expect(result).toEqual({
      ok: false,
      status: 409,
      message: "Cannot delete system while 3 actions are linked to it.",
    })
    expect(systemsCall).toBe(1)
  })

  it("deletes a system when no actions reference it", async () => {
    let systemsCall = 0
    const systemLookup = createSystemLookupChain({ id: "system-1" })
    const systemDelete = createDeleteChain(null)
    const actionCountChain = createCountChain({ count: 0 })
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "systems") {
          systemsCall += 1
          return systemsCall === 1 ? systemLookup : systemDelete
        }
        if (table === "actions") {
          return actionCountChain
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    } as unknown as App.Locals["supabase"]

    const result = await deleteSystemRecord({
      supabase,
      orgId: "org-1",
      systemId: "system-1",
    })

    expect(result).toEqual({ ok: true })
    expect(systemDelete.delete).toHaveBeenCalled()
  })

  it("enforces member flag restrictions (positive/negative RBAC case)", async () => {
    const denied = await createFlagForEntity({
      context: {
        orgId: "org-1",
        userId: "user-1",
        membershipRole: "member",
      },
      supabase: {} as App.Locals["supabase"],
      formData: new FormData(),
      expectedTargetType: "role",
      targetTable: "roles",
      missingTargetMessage: "Role not found.",
    })

    expect(denied).toEqual({
      ok: false,
      status: 400,
      payload: {
        createFlagError: "Invalid flag target.",
        createFlagTargetType: "",
        createFlagTargetId: "",
        createFlagTargetPath: "",
      },
    })

    const formData = new FormData()
    formData.set("target_type", "role")
    formData.set("target_id", "role-1")
    formData.set("flag_type", "stale")
    formData.set("message", "Outdated")

    const deniedByRole = await createFlagForEntity({
      context: {
        orgId: "org-1",
        userId: "user-1",
        membershipRole: "member",
      },
      supabase: {} as App.Locals["supabase"],
      formData,
      expectedTargetType: "role",
      targetTable: "roles",
      missingTargetMessage: "Role not found.",
    })

    expect(deniedByRole).toEqual({
      ok: false,
      status: 403,
      payload: {
        createFlagError: "Members can only create comment flags.",
        createFlagTargetType: "role",
        createFlagTargetId: "role-1",
        createFlagTargetPath: "",
      },
    })
  })

  it("creates an entity flag when inputs are valid", async () => {
    const targetChain = createTargetLookupChain({ id: "role-1" })
    const insert = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "flags") {
          return { insert }
        }
        return targetChain
      }),
    } as unknown as App.Locals["supabase"]

    const formData = new FormData()
    formData.set("target_type", "role")
    formData.set("target_id", "role-1")
    formData.set("flag_type", "comment")
    formData.set("message", "Needs owner update")
    formData.set("target_path", "description")

    const result = await createFlagForEntity({
      context: {
        orgId: "org-1",
        userId: "user-1",
        membershipRole: "member",
      },
      supabase,
      formData,
      expectedTargetType: "role",
      targetTable: "roles",
      missingTargetMessage: "Role not found.",
    })

    expect(result).toEqual({ ok: true })
    expect(insert).toHaveBeenCalledWith({
      org_id: "org-1",
      target_type: "role",
      target_id: "role-1",
      target_path: "description",
      flag_type: "comment",
      message: "Needs owner update",
      created_by: "user-1",
    })
  })
})
