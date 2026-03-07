const required = [
  "E2E_EMAIL",
  "E2E_PASSWORD",
  "E2E_PUBLIC_SUPABASE_URL",
  "E2E_PUBLIC_SUPABASE_ANON_KEY",
  "E2E_PRIVATE_SUPABASE_SERVICE_ROLE",
]

const missing = required.filter((name) => !process.env[name])

if (missing.length > 0) {
  console.error("Missing required E2E environment values:")
  for (const name of missing) {
    console.error(`- ${name}`)
  }
  console.error(
    "\nSet these values locally (env/.env) and in GitHub repository secrets before running authenticated E2E tests.",
  )
  process.exit(1)
}

console.log("E2E environment check passed.")
