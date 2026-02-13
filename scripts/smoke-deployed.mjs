import { createServerClient } from "@supabase/ssr"
import { JSDOM, VirtualConsole } from "jsdom"

const requireEnv = (name) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const requiredEnv = [
  "SMOKE_BASE_URL",
  "SMOKE_OWNER_EMAIL",
  "SMOKE_OWNER_PASSWORD",
  "SMOKE_ADMIN_EMAIL",
  "SMOKE_ADMIN_PASSWORD",
  "SMOKE_EDITOR_EMAIL",
  "SMOKE_EDITOR_PASSWORD",
  "SMOKE_MEMBER_EMAIL",
  "SMOKE_MEMBER_PASSWORD",
  "PUBLIC_SUPABASE_URL",
  "PUBLIC_SUPABASE_ANON_KEY",
]

for (const key of requiredEnv) {
  requireEnv(key)
}

const baseUrl = requireEnv("SMOKE_BASE_URL").replace(/\/+$/, "")
const baseOrigin = new URL(baseUrl).origin
const publicSupabaseUrl = requireEnv("PUBLIC_SUPABASE_URL")
const publicSupabaseAnonKey = requireEnv("PUBLIC_SUPABASE_ANON_KEY")
const virtualConsole = new VirtualConsole()
virtualConsole.on("jsdomError", () => {})

const now = new Date()
const runDateIso = now.toISOString()
const suffix = now
  .toISOString()
  .replace(/[-:TZ.]/g, "")
  .slice(0, 14)

const checks = [
  { id: "login", label: "Login (owner/admin/editor/member)", status: "pending", detail: "" },
  { id: "rbac", label: "RBAC non-owner permissions", status: "pending", detail: "" },
  { id: "crud", label: "CRUD (roles/systems/processes/actions)", status: "pending", detail: "" },
  { id: "portals", label: "Portals traversal", status: "pending", detail: "" },
  { id: "search", label: "Search endpoint + deep links", status: "pending", detail: "" },
  { id: "flags", label: "Flags create + dashboard visibility", status: "pending", detail: "" },
  { id: "billing", label: "Billing route access", status: "pending", detail: "" },
]

const findCheck = (id) => {
  const check = checks.find((item) => item.id === id)
  if (!check) {
    throw new Error(`Unknown check id: ${id}`)
  }
  return check
}

const markPass = (id, detail) => {
  const check = findCheck(id)
  check.status = "PASS"
  check.detail = detail
}

const markFail = (id, detail) => {
  const check = findCheck(id)
  check.status = "FAIL"
  check.detail = detail
}

const markSkipped = (id, detail) => {
  const check = findCheck(id)
  if (check.status === "pending") {
    check.status = "SKIP"
    check.detail = detail
  }
}

const responseSnippet = async (response) => {
  const raw = await response.clone().text()
  return raw.replace(/\s+/g, " ").trim().slice(0, 220)
}

const parseActionRedirectLocation = async (response) => {
  const headerLocation = response.headers.get("location")
  if (headerLocation) {
    return headerLocation
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    return null
  }

  const payload = await response.clone().json()
  if (
    payload &&
    typeof payload === "object" &&
    payload.type === "redirect" &&
    typeof payload.location === "string"
  ) {
    return payload.location
  }

  return null
}

const expectStatus = async (response, expectedStatuses, label) => {
  const expected = new Set(expectedStatuses)
  if (!expected.has(response.status)) {
    const snippet = await responseSnippet(response)
    throw new Error(
      `${label}: expected ${Array.from(expected).join("/")} but got ${response.status}. Response: ${snippet}`,
    )
  }
}

const resolveActionRedirectPath = async (response, fallbackPath, label) => {
  const location = await parseActionRedirectLocation(response)
  if (!location) {
    const snippet = await responseSnippet(response)
    throw new Error(`${label}: missing redirect location. Response: ${snippet}`)
  }
  return new URL(location, `${baseUrl}/`).pathname
}

const parseHiddenInput = (html, inputName) => {
  const dom = new JSDOM(html, { virtualConsole })
  const input = dom.window.document.querySelector(`input[name="${inputName}"]`)
  const value = input?.getAttribute("value")?.trim() ?? ""
  return value || null
}

const parseActionIdsInOrder = (html) => {
  const dom = new JSDOM(html, { virtualConsole })
  const forms = Array.from(
    dom.window.document.querySelectorAll('form[action="?/reorderAction"]'),
  )
  const ids = []
  for (const form of forms) {
    const direction = form.querySelector('input[name="direction"]')?.getAttribute(
      "value",
    )
    if (direction !== "up") {
      continue
    }
    const id = form
      .querySelector('input[name="action_id"]')
      ?.getAttribute("value")
      ?.trim()
    if (!id || ids.includes(id)) {
      continue
    }
    ids.push(id)
  }
  return ids
}

const hasHref = (html, hrefPrefix) => {
  const dom = new JSDOM(html, { virtualConsole })
  return Boolean(
    dom.window.document.querySelector(
      `a[href="${hrefPrefix}"], a[href^="${hrefPrefix}?"], a[href^="${hrefPrefix}#"]`,
    ),
  )
}

const createSession = async ({ label, email, password }) => {
  const cookieJar = new Map()
  const supabase = createServerClient(publicSupabaseUrl, publicSupabaseAnonKey, {
    cookies: {
      getAll() {
        return Array.from(cookieJar.entries()).map(([name, value]) => ({
          name,
          value,
        }))
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          const name = String(cookie.name ?? "")
          const value = String(cookie.value ?? "")
          const maxAge = Number(cookie.options?.maxAge)
          if (!name) {
            continue
          }
          if (!value || (!Number.isNaN(maxAge) && maxAge <= 0)) {
            cookieJar.delete(name)
          } else {
            cookieJar.set(name, value)
          }
        }
      },
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session) {
    throw new Error(
      `${label} login failed: ${error?.message ?? "session was not returned"}`,
    )
  }

  const cookieHeader = Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ")

  if (!cookieHeader) {
    throw new Error(`${label} login failed: auth cookies were not created`)
  }

  return {
    label,
    cookieHeader,
  }
}

const requestApp = async ({
  session,
  path,
  method = "GET",
  formData = null,
  expectJson = false,
}) => {
  const targetUrl = new URL(path, `${baseUrl}/`)
  const headers = {
    cookie: session.cookieHeader,
  }
  let body

  if (formData) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(formData)) {
      params.set(key, String(value))
    }
    body = params.toString()
    headers["content-type"] = "application/x-www-form-urlencoded"
    headers.origin = baseOrigin
    headers.referer = `${baseUrl}${path}`
  }

  if (expectJson) {
    headers.accept = "application/json"
  } else {
    headers.accept = "text/html,application/xhtml+xml"
  }

  return fetch(targetUrl, {
    method,
    redirect: "manual",
    headers,
    body,
  })
}

const run = async () => {
  const smokeMeta = {
    runDateIso,
    baseUrl,
  }

  const ownerSession = await createSession({
    label: "Owner",
    email: requireEnv("SMOKE_OWNER_EMAIL"),
    password: requireEnv("SMOKE_OWNER_PASSWORD"),
  })

  const adminSession = await createSession({
    label: "Admin",
    email: requireEnv("SMOKE_ADMIN_EMAIL"),
    password: requireEnv("SMOKE_ADMIN_PASSWORD"),
  })
  const editorSession = await createSession({
    label: "Editor",
    email: requireEnv("SMOKE_EDITOR_EMAIL"),
    password: requireEnv("SMOKE_EDITOR_PASSWORD"),
  })
  const memberSession = await createSession({
    label: "Member",
    email: requireEnv("SMOKE_MEMBER_EMAIL"),
    password: requireEnv("SMOKE_MEMBER_PASSWORD"),
  })

  try {
    for (const session of [ownerSession, adminSession, editorSession, memberSession]) {
      const response = await requestApp({
        session,
        path: "/app/processes",
      })
      await expectStatus(response, [200], `${session.label} app access`)
    }
    markPass("login", "All four workspace roles authenticated and loaded /app/processes.")
  } catch (error) {
    markFail("login", String(error instanceof Error ? error.message : error))
    throw error
  }

  const artifacts = {
    rolePath: "",
    roleSlug: "",
    roleId: "",
    systemPath: "",
    systemSlug: "",
    systemId: "",
    processPath: "",
    processSlug: "",
    processId: "",
    actionIds: [],
    flagMessage: `Smoke flag ${suffix}`,
    memberCommentMessage: `Smoke member comment ${suffix}`,
  }

  try {
    const roleName = `Smoke Role ${suffix}`
    const roleUpdateName = `${roleName} Updated`
    const createRoleResponse = await requestApp({
      session: ownerSession,
      path: "/app/roles?/createRole",
      method: "POST",
      formData: {
        name: roleName,
        description: `Smoke role description ${suffix}`,
        person_name: "Smoke Owner",
        hours_per_week: "6",
      },
    })
    await expectStatus(createRoleResponse, [200, 303], "Create role")
    artifacts.rolePath = await resolveActionRedirectPath(
      createRoleResponse,
      "/app/roles",
      "Create role",
    )
    artifacts.roleSlug = artifacts.rolePath.split("/").pop() ?? ""

    const roleDetailResponse = await requestApp({
      session: ownerSession,
      path: artifacts.rolePath,
    })
    await expectStatus(roleDetailResponse, [200], "Load created role detail")
    const roleDetailHtml = await roleDetailResponse.text()
    artifacts.roleId = parseHiddenInput(roleDetailHtml, "role_id") ?? ""
    if (!artifacts.roleId) {
      throw new Error("Role detail did not include role_id form input.")
    }

    const updateRoleResponse = await requestApp({
      session: ownerSession,
      path: `${artifacts.rolePath}?/updateRole`,
      method: "POST",
      formData: {
        role_id: artifacts.roleId,
        name: roleUpdateName,
        description: `Updated smoke role description ${suffix}`,
        person_name: "Smoke Owner Updated",
        hours_per_week: "7",
      },
    })
    await expectStatus(updateRoleResponse, [200, 303], "Update role")
    artifacts.rolePath = await resolveActionRedirectPath(
      updateRoleResponse,
      artifacts.rolePath,
      "Update role",
    )
    artifacts.roleSlug = artifacts.rolePath.split("/").pop() ?? artifacts.roleSlug

    const systemName = `Smoke System ${suffix}`
    const systemUpdateName = `${systemName} Updated`
    const createSystemResponse = await requestApp({
      session: ownerSession,
      path: "/app/systems?/createSystem",
      method: "POST",
      formData: {
        name: systemName,
        description: `Smoke system description ${suffix}`,
        location: "Smoke HQ",
        url: "https://example.com/smoke",
        owner_role_id: artifacts.roleId,
      },
    })
    await expectStatus(createSystemResponse, [200, 303], "Create system")
    artifacts.systemPath = await resolveActionRedirectPath(
      createSystemResponse,
      "/app/systems",
      "Create system",
    )
    artifacts.systemSlug = artifacts.systemPath.split("/").pop() ?? ""

    const systemDetailResponse = await requestApp({
      session: ownerSession,
      path: artifacts.systemPath,
    })
    await expectStatus(systemDetailResponse, [200], "Load created system detail")
    const systemDetailHtml = await systemDetailResponse.text()
    artifacts.systemId = parseHiddenInput(systemDetailHtml, "system_id") ?? ""
    if (!artifacts.systemId) {
      throw new Error("System detail did not include system_id form input.")
    }

    const updateSystemResponse = await requestApp({
      session: ownerSession,
      path: `${artifacts.systemPath}?/updateSystem`,
      method: "POST",
      formData: {
        system_id: artifacts.systemId,
        name: systemUpdateName,
        description: `Updated smoke system description ${suffix}`,
        location: "Smoke HQ Updated",
        url: "https://example.com/smoke-updated",
        owner_role_id: artifacts.roleId,
      },
    })
    await expectStatus(updateSystemResponse, [200, 303], "Update system")
    artifacts.systemPath = await resolveActionRedirectPath(
      updateSystemResponse,
      artifacts.systemPath,
      "Update system",
    )
    artifacts.systemSlug = artifacts.systemPath.split("/").pop() ?? artifacts.systemSlug

    const processName = `Smoke Process ${suffix}`
    const createProcessResponse = await requestApp({
      session: ownerSession,
      path: "/app/processes?/createProcess",
      method: "POST",
      formData: {
        name: processName,
        description: `Smoke process description ${suffix}`,
        trigger: "Smoke trigger",
        end_state: "Smoke outcome",
        owner_role_id: artifacts.roleId,
      },
    })
    await expectStatus(createProcessResponse, [200, 303], "Create process")
    artifacts.processPath = await resolveActionRedirectPath(
      createProcessResponse,
      "/app/processes",
      "Create process",
    )
    artifacts.processSlug = artifacts.processPath.split("/").pop() ?? ""

    const processDetailResponse = await requestApp({
      session: ownerSession,
      path: artifacts.processPath,
    })
    await expectStatus(processDetailResponse, [200], "Load created process detail")
    const processDetailHtml = await processDetailResponse.text()
    artifacts.processId = parseHiddenInput(processDetailHtml, "process_id") ?? ""
    if (!artifacts.processId) {
      throw new Error("Process detail did not include process_id form input.")
    }

    const actionOneDescription = `Smoke Action A ${suffix}`
    const actionTwoDescription = `Smoke Action B ${suffix}`
    const createActionOneResponse = await requestApp({
      session: ownerSession,
      path: `${artifacts.processPath}?/createAction`,
      method: "POST",
      formData: {
        description: actionOneDescription,
        owner_role_id: artifacts.roleId,
        system_id: artifacts.systemId,
        sequence: "1",
      },
    })
    await expectStatus(createActionOneResponse, [200, 303], "Create action A")

    const createActionTwoResponse = await requestApp({
      session: ownerSession,
      path: `${artifacts.processPath}?/createAction`,
      method: "POST",
      formData: {
        description: actionTwoDescription,
        owner_role_id: artifacts.roleId,
        system_id: artifacts.systemId,
        sequence: "2",
      },
    })
    await expectStatus(createActionTwoResponse, [200, 303], "Create action B")

    const processAfterCreateResponse = await requestApp({
      session: ownerSession,
      path: artifacts.processPath,
    })
    await expectStatus(processAfterCreateResponse, [200], "Load process after action create")
    const processAfterCreateHtml = await processAfterCreateResponse.text()
    artifacts.actionIds = parseActionIdsInOrder(processAfterCreateHtml)
    if (artifacts.actionIds.length < 2) {
      throw new Error("Expected at least two actions after creation.")
    }

    const movedActionId = artifacts.actionIds[1]
    const reorderResponse = await requestApp({
      session: ownerSession,
      path: `${artifacts.processPath}?/reorderAction`,
      method: "POST",
      formData: {
        action_id: movedActionId,
        direction: "up",
      },
    })
    await expectStatus(reorderResponse, [200, 303], "Reorder action")

    const processAfterReorderResponse = await requestApp({
      session: ownerSession,
      path: artifacts.processPath,
    })
    await expectStatus(processAfterReorderResponse, [200], "Load process after reorder")
    const processAfterReorderHtml = await processAfterReorderResponse.text()
    const reorderedIds = parseActionIdsInOrder(processAfterReorderHtml)
    if (reorderedIds[0] !== movedActionId) {
      throw new Error("Action reorder did not place selected action first.")
    }

    const updatedActionDescription = `Smoke Action B Updated ${suffix}`
    const updateActionResponse = await requestApp({
      session: ownerSession,
      path: `${artifacts.processPath}?/createAction`,
      method: "POST",
      formData: {
        action_id: movedActionId,
        description: updatedActionDescription,
        owner_role_id: artifacts.roleId,
        system_id: artifacts.systemId,
      },
    })
    await expectStatus(updateActionResponse, [200, 303], "Update action")

    const deleteActionResponse = await requestApp({
      session: ownerSession,
      path: `${artifacts.processPath}?/deleteAction`,
      method: "POST",
      formData: {
        action_id: artifacts.actionIds[0],
      },
    })
    await expectStatus(deleteActionResponse, [200, 303], "Delete one action")

    markPass(
      "crud",
      "Created/updated/deleted role, system, process, and action in deployed app.",
    )

    const adminRoleName = `Smoke Admin Role ${suffix}`
    const adminCreateRoleResponse = await requestApp({
      session: adminSession,
      path: "/app/roles?/createRole",
      method: "POST",
      formData: {
        name: adminRoleName,
        description: `Smoke admin role description ${suffix}`,
        person_name: "Smoke Admin",
        hours_per_week: "4",
      },
    })
    await expectStatus(adminCreateRoleResponse, [200, 303], "Admin create role")
    const adminRolePath = await resolveActionRedirectPath(
      adminCreateRoleResponse,
      "/app/roles",
      "Admin create role",
    )

    const adminRoleDetailResponse = await requestApp({
      session: adminSession,
      path: adminRolePath,
    })
    await expectStatus(adminRoleDetailResponse, [200], "Admin role detail load")
    const adminRoleDetailHtml = await adminRoleDetailResponse.text()
    const adminRoleId = parseHiddenInput(adminRoleDetailHtml, "role_id") ?? ""
    if (!adminRoleId) {
      throw new Error("Admin role detail did not include role_id form input.")
    }

    const adminDeleteRoleResponse = await requestApp({
      session: adminSession,
      path: `${adminRolePath}?/deleteRole`,
      method: "POST",
      formData: {
        role_id: adminRoleId,
      },
    })
    await expectStatus(adminDeleteRoleResponse, [200, 303], "Admin role cleanup")

    const editorCreateRoleResponse = await requestApp({
      session: editorSession,
      path: "/app/roles?/createRole",
      method: "POST",
      formData: {
        name: `Smoke Editor Role Blocked ${suffix}`,
        description: "Editor should not be able to create directory roles.",
        person_name: "Smoke Editor",
        hours_per_week: "3",
      },
    })
    if (editorCreateRoleResponse.status !== 403) {
      const snippet = await responseSnippet(editorCreateRoleResponse)
      throw new Error(
        `Editor role create expected 403 but received ${editorCreateRoleResponse.status}: ${snippet}`,
      )
    }

    const editorCreateActionResponse = await requestApp({
      session: editorSession,
      path: `${artifacts.processPath}?/createAction`,
      method: "POST",
      formData: {
        description: `Smoke Editor Action ${suffix}`,
        owner_role_id: artifacts.roleId,
        system_id: artifacts.systemId,
        sequence: "3",
      },
    })
    await expectStatus(editorCreateActionResponse, [200, 303], "Editor create action")

    const memberCreateActionResponse = await requestApp({
      session: memberSession,
      path: `${artifacts.processPath}?/createAction`,
      method: "POST",
      formData: {
        description: `Smoke Member Action Blocked ${suffix}`,
        owner_role_id: artifacts.roleId,
        system_id: artifacts.systemId,
        sequence: "4",
      },
    })
    if (memberCreateActionResponse.status !== 403) {
      const snippet = await responseSnippet(memberCreateActionResponse)
      throw new Error(
        `Member action create expected 403 but received ${memberCreateActionResponse.status}: ${snippet}`,
      )
    }

    const memberCommentResponse = await requestApp({
      session: memberSession,
      path: `${artifacts.processPath}?/createFlag`,
      method: "POST",
      formData: {
        target_type: "process",
        target_id: artifacts.processId,
        flag_type: "comment",
        message: artifacts.memberCommentMessage,
        target_path: "description",
      },
    })
    await expectStatus(memberCommentResponse, [200], "Member create comment flag")

    const memberNeedsReviewResponse = await requestApp({
      session: memberSession,
      path: `${artifacts.processPath}?/createFlag`,
      method: "POST",
      formData: {
        target_type: "process",
        target_id: artifacts.processId,
        flag_type: "needs_review",
        message: `Smoke member non-comment blocked ${suffix}`,
        target_path: "description",
      },
    })
    if (memberNeedsReviewResponse.status !== 403) {
      const snippet = await responseSnippet(memberNeedsReviewResponse)
      throw new Error(
        `Member non-comment flag create expected 403 but received ${memberNeedsReviewResponse.status}: ${snippet}`,
      )
    }

    markPass(
      "rbac",
      "Admin can manage directory, editor can edit process actions but not directory roles, and member is limited to comment flags/read-only flow.",
    )

    const roleTraversalResponse = await requestApp({
      session: ownerSession,
      path: artifacts.rolePath,
    })
    await expectStatus(roleTraversalResponse, [200], "Role traversal page load")
    const roleTraversalHtml = await roleTraversalResponse.text()
    const hasProcessPortalFromRole = hasHref(
      roleTraversalHtml,
      `/app/processes/${artifacts.processSlug}`,
    )
    const hasSystemPortalFromRole = hasHref(
      roleTraversalHtml,
      `/app/systems/${artifacts.systemSlug}`,
    )
    if (!hasProcessPortalFromRole || !hasSystemPortalFromRole) {
      throw new Error(
        "Role detail did not include expected process/system traversal links.",
      )
    }

    const systemTraversalResponse = await requestApp({
      session: ownerSession,
      path: artifacts.systemPath,
    })
    await expectStatus(systemTraversalResponse, [200], "System traversal page load")
    const systemTraversalHtml = await systemTraversalResponse.text()
    const hasProcessPortalFromSystem = hasHref(
      systemTraversalHtml,
      `/app/processes/${artifacts.processSlug}`,
    )
    const hasRolePortalFromSystem = hasHref(
      systemTraversalHtml,
      `/app/roles/${artifacts.roleSlug}`,
    )
    if (!hasProcessPortalFromSystem || !hasRolePortalFromSystem) {
      throw new Error(
        "System detail did not include expected process/role traversal links.",
      )
    }

    const processTraversalResponse = await requestApp({
      session: ownerSession,
      path: artifacts.processPath,
    })
    await expectStatus(
      processTraversalResponse,
      [200],
      "Process traversal page load",
    )
    const processTraversalHtml = await processTraversalResponse.text()
    const hasRolePortalFromProcess = hasHref(
      processTraversalHtml,
      `/app/roles/${artifacts.roleSlug}`,
    )
    const hasSystemPortalFromProcess = hasHref(
      processTraversalHtml,
      `/app/systems/${artifacts.systemSlug}`,
    )
    if (!hasRolePortalFromProcess || !hasSystemPortalFromProcess) {
      throw new Error("Process detail did not include expected role/system links.")
    }

    markPass(
      "portals",
      "Role, system, and process detail pages rendered expected deep-link portals.",
    )

    const searchResponse = await requestApp({
      session: ownerSession,
      path: `/app/search?q=${encodeURIComponent(suffix)}&limit=20`,
      expectJson: true,
    })
    await expectStatus(searchResponse, [200], "Search endpoint")
    const searchPayload = await searchResponse.json()
    const results = Array.isArray(searchPayload.results)
      ? searchPayload.results
      : []
    const resultTypes = new Set(results.map((item) => item.type))
    const hasProcess = resultTypes.has("process")
    const hasRole = resultTypes.has("role")
    const hasSystem = resultTypes.has("system")
    const hasAction = resultTypes.has("action")
    const hasActionDeepLink = results.some(
      (item) =>
        item.type === "action" &&
        typeof item.href === "string" &&
        item.href.includes(`/app/processes/${artifacts.processSlug}`) &&
        item.href.includes("actionId="),
    )
    if (!hasProcess || !hasRole || !hasSystem || !hasAction || !hasActionDeepLink) {
      throw new Error(
        "Search results were missing expected entity types or action deep-link route.",
      )
    }

    markPass(
      "search",
      "Search returned role/system/process/action results with action deep-link into process detail.",
    )

    const createFlagResponse = await requestApp({
      session: ownerSession,
      path: `${artifacts.processPath}?/createFlag`,
      method: "POST",
      formData: {
        target_type: "process",
        target_id: artifacts.processId,
        flag_type: "needs_review",
        message: artifacts.flagMessage,
        target_path: "description",
      },
    })
    await expectStatus(createFlagResponse, [200], "Create field-level flag")
    const flagsPageResponse = await requestApp({
      session: ownerSession,
      path: "/app/flags",
    })
    await expectStatus(flagsPageResponse, [200], "Flags dashboard load")
    const flagsPageHtml = await flagsPageResponse.text()
    if (
      !flagsPageHtml.includes(artifacts.flagMessage) ||
      !flagsPageHtml.includes(artifacts.memberCommentMessage)
    ) {
      throw new Error("Created flag message was not visible on /app/flags.")
    }

    markPass(
      "flags",
      "Field-level process flag created and visible on flags dashboard.",
    )

    const billingResponse = await requestApp({
      session: ownerSession,
      path: "/account/billing",
    })
    if (billingResponse.status >= 500) {
      const snippet = await responseSnippet(billingResponse)
      throw new Error(`Billing route returned ${billingResponse.status}: ${snippet}`)
    }
    if (![200, 303].includes(billingResponse.status)) {
      throw new Error(
        `Billing route returned unexpected status ${billingResponse.status}.`,
      )
    }
    const billingLocation = billingResponse.headers.get("location") ?? ""
    if (billingResponse.status === 303 && billingLocation.startsWith("/login")) {
      throw new Error("Billing route redirected to /login for authenticated owner.")
    }

    markPass(
      "billing",
      `Billing route responded ${billingResponse.status}${billingLocation ? ` (${billingLocation})` : ""}.`,
    )

    const processDeleteResponse = await requestApp({
      session: ownerSession,
      path: `${artifacts.processPath}?/deleteProcess`,
      method: "POST",
      formData: {
        process_id: artifacts.processId,
      },
    })

    if (processDeleteResponse.status === 400) {
      const processHtml = await (await requestApp({
        session: ownerSession,
        path: artifacts.processPath,
      })).text()
      const remainingActionIds = parseActionIdsInOrder(processHtml)
      for (const actionId of remainingActionIds) {
        const deleteRemainingActionResponse = await requestApp({
          session: ownerSession,
          path: `${artifacts.processPath}?/deleteAction`,
          method: "POST",
          formData: {
            action_id: actionId,
          },
        })
        await expectStatus(
          deleteRemainingActionResponse,
          [200, 303],
          "Delete remaining action during cleanup",
        )
      }

      const retryProcessDeleteResponse = await requestApp({
        session: ownerSession,
        path: `${artifacts.processPath}?/deleteProcess`,
        method: "POST",
        formData: {
          process_id: artifacts.processId,
        },
      })
      await expectStatus(
        retryProcessDeleteResponse,
        [200, 303],
        "Delete process cleanup",
      )
    } else {
      await expectStatus(processDeleteResponse, [200, 303], "Delete process cleanup")
    }

    const deleteSystemResponse = await requestApp({
      session: ownerSession,
      path: `${artifacts.systemPath}?/deleteSystem`,
      method: "POST",
      formData: {
        system_id: artifacts.systemId,
      },
    })
    await expectStatus(deleteSystemResponse, [200, 303], "Delete system cleanup")

    const deleteRoleResponse = await requestApp({
      session: ownerSession,
      path: `${artifacts.rolePath}?/deleteRole`,
      method: "POST",
      formData: {
        role_id: artifacts.roleId,
      },
    })
    await expectStatus(deleteRoleResponse, [200, 303], "Delete role cleanup")
  } catch (error) {
    if (findCheck("rbac").status === "pending") {
      markFail("rbac", String(error instanceof Error ? error.message : error))
    }
    if (findCheck("crud").status === "pending") {
      markFail("crud", String(error instanceof Error ? error.message : error))
    }
    if (findCheck("portals").status === "pending") {
      markFail("portals", "Not reached due earlier failure.")
    }
    if (findCheck("search").status === "pending") {
      markFail("search", "Not reached due earlier failure.")
    }
    if (findCheck("flags").status === "pending") {
      markFail("flags", "Not reached due earlier failure.")
    }
    if (findCheck("billing").status === "pending") {
      markFail("billing", "Not reached due earlier failure.")
    }
    throw error
  } finally {
    markSkipped("rbac", "Not reached.")
    markSkipped("crud", "Not reached.")
    markSkipped("portals", "Not reached.")
    markSkipped("search", "Not reached.")
    markSkipped("flags", "Not reached.")
    markSkipped("billing", "Not reached.")
  }

  const failedChecks = checks.filter((check) => check.status === "FAIL")

  console.log("LP-061 deployed smoke run")
  console.log(`run_date_utc=${smokeMeta.runDateIso}`)
  console.log(`base_url=${smokeMeta.baseUrl}`)
  console.log("")
  for (const check of checks) {
    console.log(`${check.status.padEnd(4)} | ${check.label}`)
    if (check.detail) {
      console.log(`      ${check.detail}`)
    }
  }

  if (failedChecks.length > 0) {
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error(String(error instanceof Error ? error.message : error))
  process.exit(1)
})
