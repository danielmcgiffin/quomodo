import { realpathSync } from "node:fs"
import { resolve } from "node:path"
import { sveltekit } from "@sveltejs/kit/vite"
import { searchForWorkspaceRoot } from "vite"
import { defineConfig } from "vitest/config"
import { buildAndCacheSearchIndex } from "./src/lib/build_index"

const projectRoot = process.cwd()
const serverFsAllow = Array.from(
  new Set([
    searchForWorkspaceRoot(projectRoot),
    projectRoot,
    realpathSync(projectRoot),
    realpathSync(resolve(projectRoot, "node_modules")),
  ]),
)

export default defineConfig({
  server: {
    host: true,
    strictPort: true,
    fs: {
      allow: serverFsAllow,
    },
    // Open Code may proxy through generated hostnames/subdomains.
    // Accept all hosts in dev to avoid Vite host-header 403s behind the proxy.
    allowedHosts: true,
  },
  plugins: [
    sveltekit(),
    {
      name: "vite-build-search-index",
      writeBundle: {
        order: "post",
        sequential: false,
        handler: async () => {
          console.log("Building search index...")
          await buildAndCacheSearchIndex()
        },
      },
    },
  ],
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
    globals: true, /// allows to skip import of test functions like `describe`, `it`, `expect`, etc.
  },
})
