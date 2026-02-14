import adapterAuto from "@sveltejs/adapter-auto"
import adapterCloudflare from "@sveltejs/adapter-cloudflare"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // adapter-cloudflare uses Miniflare during the build to emulate the platform,
    // which requires binding a loopback port. In sandboxed environments where
    // `127.0.0.1` binding is disallowed, fall back to adapter-auto for local builds.
    adapter:
      process.env.CF_PAGES ||
      process.env.CF_WORKERS ||
      process.env.WRANGLER ||
      process.env.ADAPTER_CLOUDFLARE === "1"
        ? adapterCloudflare()
        : adapterAuto(),
    // allow up to 150kb of style to be inlined with the HTML
    // Faster FCP (First Contentful Paint) by reducing the number of requests
    inlineStyleThreshold: 150000,
  },
  preprocess: vitePreprocess(),
}

export default config
