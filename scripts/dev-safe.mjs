#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"

const DEFAULT_PORT = 5173
const cliArgs = process.argv.slice(2)
const projectRoot = process.cwd()

const readPortFromArgs = (args) => {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]

    if (arg === "--port" || arg === "-p") {
      const next = args[i + 1]
      if (!next) return null
      const parsed = Number.parseInt(next, 10)
      return Number.isFinite(parsed) ? parsed : null
    }

    if (arg.startsWith("--port=")) {
      const parsed = Number.parseInt(arg.slice("--port=".length), 10)
      return Number.isFinite(parsed) ? parsed : null
    }

    if (arg.startsWith("-p") && arg.length > 2) {
      const parsed = Number.parseInt(arg.slice(2), 10)
      return Number.isFinite(parsed) ? parsed : null
    }
  }

  return null
}

const port =
  readPortFromArgs(cliArgs) ??
  Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10)

const listListeners = () => {
  const result = spawnSync("ss", ["-ltnpH"], { encoding: "utf8" })
  if (result.status !== 0) {
    return []
  }
  return result.stdout.split("\n").filter(Boolean)
}

const parsePid = (line) => {
  const match = line.match(/pid=(\d+)/)
  if (!match) return null
  return Number.parseInt(match[1], 10)
}

const commandForPid = (pid) => {
  const path = `/proc/${pid}/cmdline`
  if (!existsSync(path)) return ""
  return readFileSync(path, "utf8").replace(/\u0000/g, " ").trim()
}

const waitForExit = async (pid, timeoutMs = 2000) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (!existsSync(`/proc/${pid}`)) return true
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return !existsSync(`/proc/${pid}`)
}

const tryClearStaleVite = async () => {
  const listeners = listListeners()
  const portSuffix = `:${port}`
  const candidate = listeners.find((line) => line.includes(portSuffix))
  if (!candidate) return

  const pid = parsePid(candidate)
  if (!pid) {
    console.error(`Port ${port} is in use but PID could not be determined.`)
    process.exit(1)
  }

  const cmd = commandForPid(pid)
  const isThisProjectVite =
    cmd.includes(`${projectRoot}/node_modules/.bin/vite`) ||
    (cmd.includes("vite dev") && cmd.includes(projectRoot))

  if (!isThisProjectVite) {
    console.error(`Port ${port} is in use by another process (PID ${pid}).`)
    console.error(cmd || "<unknown command>")
    console.error("Refusing to kill automatically.")
    process.exit(1)
  }

  console.log(`Found stale Vite process on port ${port} (PID ${pid}), stopping it...`)
  try {
    process.kill(pid, "SIGTERM")
  } catch {
    return
  }

  const exited = await waitForExit(pid)
  if (!exited) {
    try {
      process.kill(pid, "SIGKILL")
    } catch {
      // ignore
    }
  }
}

await tryClearStaleVite()

const viteArgs = ["dev", ...cliArgs]
const child = spawn("vite", viteArgs, { stdio: "inherit", env: process.env })

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
