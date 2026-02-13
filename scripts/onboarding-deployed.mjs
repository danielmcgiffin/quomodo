import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { JSDOM, VirtualConsole } from "jsdom"

const requireEnv = (name) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const baseUrl = requireEnv("SMOKE_BASE_URL").replace(/\/+$/, "")
const baseOrigin = new URL(baseUrl).origin
const publicSupabaseUrl = requireEnv("PUBLIC_SUPABASE_URL")
const publicSupabaseAnonKey = requireEnv("PUBLIC_SUPABASE_ANON_KEY")
const privateSupabaseServiceRole = requireEnv("PRIVATE_SUPABASE_SERVICE_ROLE")

const now = new Date()
const runDateIso = now.toISOString()
const suffix = now
  .toISOString()
  .replace(/[-:TZ.]/g, "")
  .slice(0, 14)

const onboardingEmail =
  process.env.ONBOARDING_TEST_EMAIL ?? `onboarding${suffix}@example.com`
const onboardingPassword =
  process.env.ONBOARDING_TEST_PASSWORD ?? `Sc!${suffix}aA`

const virtualConsole = new VirtualConsole()
virtualConsole.on("jsdomError", () => {})

const steps = [
  {
    id: "signup",
    label: "Sign up external user",
    status: "pending",
    detail: "",
  },
  {
    id: "verify",
    label: "Verify email and sign in",
    status: "pending",
    detail: "",
  },
  {
    id: "profile",
    label: "Create profile and reach /app/processes",
    status: "pending",
    detail: "",
  },
  {
    id: "entities",
    label: "Create first role/system/process/action",
    status: "pending",
    detail: "",
  },
  {
    id: "search",
    label: "Run search and deep-link retrieval",
    status: "pending",
    detail: "",
  },
  {
    id: "flag",
    label: "File first flag and verify dashboard",
    status: "pending",
    detail: "",
  },
]

const findStep = (id) => {
  const step = steps.find((entry) => entry.id === id)
  if (!step) {
    throw new Error(`Unknown step id: ${id}`)
  }
  return step
}

const markPass = (id, detail) => {
  const step = findStep(id)
  step.status = "PASS"
  step.detail = detail
}

const markFail = (id, detail) => {
  const step = findStep(id)
  step.status = "FAIL"
  step.detail = detail
}

const markSkipped = (id, detail) => {
  const step = findStep(id)
  if (step.status === "pending") {
    step.status = "SKIP"
    step.detail = detail
  }
}

const responseSnippet = async (response) => {
  const raw = await response.clone().text()
  return raw.replace(/\s+/g, " ").trim().slice(0, 220)
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

const resolveActionRedirectPath = async (response, fallbackPath, label) => {
  const location = await parseActionRedirectLocation(response)
  if (!location) {
    const snippet = await responseSnippet(response)
    throw new Error(`${label}: missing redirect location. Response: ${snippet}`)
  }
  return new URL(location, `${baseUrl}/`).pathname || fallbackPath
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
    const direction = form
      .querySelector('input[name="direction"]')
      ?.getAttribute("value")
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

const createAuthSession = () => {
  const cookieJar = new Map()
  const client = createServerClient(publicSupabaseUrl, publicSupabaseAnonKey, {
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

  return {
    client,
    getCookieHeader() {
      return Array.from(cookieJar.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ")
    },
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
  const isActionRequest = Boolean(formData) && targetUrl.search.startsWith("?/")
  const headers = {}
  const cookieHeader = session.getCookieHeader()
  if (cookieHeader) {
    headers.cookie = cookieHeader
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

  if (isActionRequest) {
    headers["x-sveltekit-action"] = "true"
    headers.accept = "application/json"
  } else if (expectJson) {
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

const serviceSupabase = createClient(
  publicSupabaseUrl,
  privateSupabaseServiceRole,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

const run = async () => {
  const authSession = createAuthSession()
  const artifacts = {
    userId: "",
    signupMode: "external",
    rolePath: "",
    roleId: "",
    roleSlug: "",
    systemPath: "",
    systemId: "",
    systemSlug: "",
    processPath: "",
    processId: "",
    processSlug: "",
    flagMessage: `Onboarding flag ${suffix}`,
  }

  const runStep = async (id, fn) => {
    try {
      const detail = await fn()
      markPass(id, detail)
    } catch (error) {
      markFail(id, String(error instanceof Error ? error.message : error))
      throw error
    }
  }

  try {
    await runStep("signup", async () => {
      const { data, error } = await authSession.client.auth.signUp({
        email: onboardingEmail,
        password: onboardingPassword,
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes("email rate limit exceeded")) {
          const { data: fallbackData, error: fallbackError } =
            await serviceSupabase.auth.admin.createUser({
              email: onboardingEmail,
              password: onboardingPassword,
              email_confirm: true,
              user_metadata: {
                full_name: `Onboarding User ${suffix}`,
              },
            })

          if (fallbackError || !fallbackData?.user?.id) {
            throw new Error(
              `Sign up failed (rate-limited) and admin fallback failed: ${fallbackError?.message}`,
            )
          }

          artifacts.userId = fallbackData.user.id
          artifacts.signupMode = "admin_fallback"
          return `Signup endpoint rate-limited; created confirmed user via admin fallback (${onboardingEmail}).`
        }

        throw new Error(`Sign up failed: ${error.message}`)
      }

      if (!data.user?.id) {
        throw new Error("Sign up failed: user was not returned.")
      }

      artifacts.userId = data.user.id
      return `Created user ${onboardingEmail} (${artifacts.userId}).`
    })

    await runStep("verify", async () => {
      if (artifacts.signupMode === "admin_fallback") {
        const { data: loginData, error: loginError } =
          await authSession.client.auth.signInWithPassword({
            email: onboardingEmail,
            password: onboardingPassword,
          })
        if (loginError || !loginData.session) {
          throw new Error(
            `Sign in failed after admin-fallback signup: ${loginError?.message}`,
          )
        }

        return "Email verification bypassed by admin-created confirmed user (signup endpoint was rate-limited); sign-in succeeded."
      }

      const { data: signInData } = await authSession.client.auth.getSession()
      const hasSession = Boolean(signInData?.session)

      if (!hasSession) {
        const { error } = await serviceSupabase.auth.admin.updateUserById(
          artifacts.userId,
          { email_confirm: true },
        )
        if (error) {
          throw new Error(`Email confirm step failed: ${error.message}`)
        }
      }

      const { data: loginData, error: loginError } =
        await authSession.client.auth.signInWithPassword({
          email: onboardingEmail,
          password: onboardingPassword,
        })
      if (loginError || !loginData.session) {
        throw new Error(
          `Sign in failed after verification: ${loginError?.message}`,
        )
      }

      return hasSession
        ? "Session returned at signup (email confirmation not enforced in this environment)."
        : "Email confirmation enforced; verified via admin-confirm path, then sign-in succeeded."
    })

    await runStep("profile", async () => {
      const profilePageResponse = await requestApp({
        session: authSession,
        path: "/account/create_profile",
      })
      await expectStatus(profilePageResponse, [200], "Create profile page load")

      const profileUpdateResponse = await requestApp({
        session: authSession,
        path: "/account/api?/updateProfile",
        method: "POST",
        formData: {
          fullName: `Onboarding User ${suffix}`,
          companyName: `SystemsCraft Onboarding ${suffix}`,
          website: "https://systemscraft.co",
        },
      })
      await expectStatus(profileUpdateResponse, [200], "Create profile submit")

      const appProcessesResponse = await requestApp({
        session: authSession,
        path: "/app/processes",
      })
      await expectStatus(
        appProcessesResponse,
        [200],
        "Load /app/processes after profile",
      )

      return "Profile created and /app/processes loaded successfully."
    })

    await runStep("entities", async () => {
      const roleName = `Onboarding Role ${suffix}`
      const createRoleResponse = await requestApp({
        session: authSession,
        path: "/app/roles?/createRole",
        method: "POST",
        formData: {
          name: roleName,
          description: `Onboarding role description ${suffix}`,
        },
      })
      await expectStatus(createRoleResponse, [200, 303], "Create role")
      artifacts.rolePath = await resolveActionRedirectPath(
        createRoleResponse,
        "/app/roles",
        "Create role",
      )
      artifacts.roleSlug = artifacts.rolePath.split("/").pop() ?? ""

      const rolePageResponse = await requestApp({
        session: authSession,
        path: artifacts.rolePath,
      })
      await expectStatus(rolePageResponse, [200], "Load role detail")
      const rolePageHtml = await rolePageResponse.text()
      artifacts.roleId = parseHiddenInput(rolePageHtml, "role_id") ?? ""
      if (!artifacts.roleId) {
        throw new Error("Role detail missing role_id.")
      }

      const createSystemResponse = await requestApp({
        session: authSession,
        path: "/app/systems?/createSystem",
        method: "POST",
        formData: {
          name: `Onboarding System ${suffix}`,
          description: `Onboarding system description ${suffix}`,
          location: "HQ",
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

      const systemPageResponse = await requestApp({
        session: authSession,
        path: artifacts.systemPath,
      })
      await expectStatus(systemPageResponse, [200], "Load system detail")
      const systemPageHtml = await systemPageResponse.text()
      artifacts.systemId = parseHiddenInput(systemPageHtml, "system_id") ?? ""
      if (!artifacts.systemId) {
        throw new Error("System detail missing system_id.")
      }

      const createProcessResponse = await requestApp({
        session: authSession,
        path: "/app/processes?/createProcess",
        method: "POST",
        formData: {
          name: `Onboarding Process ${suffix}`,
          description: `Onboarding process description ${suffix}`,
          trigger: "New customer signed",
          end_state: "Customer onboarded",
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

      const processPageResponse = await requestApp({
        session: authSession,
        path: artifacts.processPath,
      })
      await expectStatus(processPageResponse, [200], "Load process detail")
      const processPageHtml = await processPageResponse.text()
      artifacts.processId =
        parseHiddenInput(processPageHtml, "process_id") ?? ""
      if (!artifacts.processId) {
        throw new Error("Process detail missing process_id.")
      }

      const createActionResponse = await requestApp({
        session: authSession,
        path: `${artifacts.processPath}?/createAction`,
        method: "POST",
        formData: {
          description: `Onboarding Action ${suffix}`,
          owner_role_id: artifacts.roleId,
          system_id: artifacts.systemId,
          sequence: "1",
        },
      })
      await expectStatus(createActionResponse, [200, 303], "Create action")

      return "Created role, system, process, and action from onboarding account."
    })

    await runStep("search", async () => {
      const searchResponse = await requestApp({
        session: authSession,
        path: `/app/search?q=${encodeURIComponent(suffix)}&limit=20`,
        expectJson: true,
      })
      await expectStatus(searchResponse, [200], "Search endpoint")

      const payload = await searchResponse.json()
      const results = Array.isArray(payload.results) ? payload.results : []
      const types = new Set(results.map((result) => result.type))
      if (
        !types.has("role") ||
        !types.has("system") ||
        !types.has("process") ||
        !types.has("action")
      ) {
        throw new Error("Search did not return all expected entity types.")
      }

      return "Search returned role/system/process/action results for onboarding entities."
    })

    await runStep("flag", async () => {
      const createFlagResponse = await requestApp({
        session: authSession,
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
      await expectStatus(createFlagResponse, [200], "Create onboarding flag")

      const flagsPageResponse = await requestApp({
        session: authSession,
        path: "/app/flags",
      })
      await expectStatus(flagsPageResponse, [200], "Load flags page")
      const flagsPageHtml = await flagsPageResponse.text()
      if (!flagsPageHtml.includes(artifacts.flagMessage)) {
        throw new Error("Onboarding flag was not present in /app/flags.")
      }

      return "Flag created and visible in flags dashboard."
    })
  } finally {
    const safeCleanup = async (label, fn) => {
      try {
        await fn()
      } catch (error) {
        console.log(
          `CLEANUP_WARN | ${label}: ${String(error instanceof Error ? error.message : error)}`,
        )
      }
    }

    if (artifacts.processPath && artifacts.processId) {
      await safeCleanup("delete_process", async () => {
        const processPageResponse = await requestApp({
          session: authSession,
          path: artifacts.processPath,
        })
        if (processPageResponse.status === 200) {
          const html = await processPageResponse.text()
          const actionIds = parseActionIdsInOrder(html)
          for (const actionId of actionIds) {
            await requestApp({
              session: authSession,
              path: `${artifacts.processPath}?/deleteAction`,
              method: "POST",
              formData: { action_id: actionId },
            })
          }
        }
        await requestApp({
          session: authSession,
          path: `${artifacts.processPath}?/deleteProcess`,
          method: "POST",
          formData: { process_id: artifacts.processId },
        })
      })
    }

    if (artifacts.systemPath && artifacts.systemId) {
      await safeCleanup("delete_system", async () => {
        await requestApp({
          session: authSession,
          path: `${artifacts.systemPath}?/deleteSystem`,
          method: "POST",
          formData: { system_id: artifacts.systemId },
        })
      })
    }

    if (artifacts.rolePath && artifacts.roleId) {
      await safeCleanup("delete_role", async () => {
        await requestApp({
          session: authSession,
          path: `${artifacts.rolePath}?/deleteRole`,
          method: "POST",
          formData: { role_id: artifacts.roleId },
        })
      })
    }

    if (artifacts.userId) {
      await safeCleanup("delete_user", async () => {
        const { error } = await serviceSupabase.auth.admin.deleteUser(
          artifacts.userId,
          true,
        )
        if (error) {
          throw new Error(error.message)
        }
      })
    }

    markSkipped("signup", "Not reached.")
    markSkipped("verify", "Not reached.")
    markSkipped("profile", "Not reached.")
    markSkipped("entities", "Not reached.")
    markSkipped("search", "Not reached.")
    markSkipped("flag", "Not reached.")

    console.log("LP-068 onboarding validation run")
    console.log(`run_date_utc=${runDateIso}`)
    console.log(`base_url=${baseUrl}`)
    console.log(`test_email=${onboardingEmail}`)
    console.log("")
    for (const step of steps) {
      console.log(`${step.status.padEnd(4)} | ${step.label}`)
      if (step.detail) {
        console.log(`      ${step.detail}`)
      }
    }

    const failed = steps.some((step) => step.status === "FAIL")
    if (failed) {
      process.exitCode = 1
    }
  }
}

run().catch((error) => {
  console.error(String(error instanceof Error ? error.message : error))
  process.exit(1)
})
