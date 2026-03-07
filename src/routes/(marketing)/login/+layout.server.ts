import type { LayoutServerLoad } from "./$types"

const resolveProxyPrefix = (pathname: string) => {
  const match = pathname.match(/^\/proxy\/\d+/)
  return match ? match[0] : ""
}

export const load: LayoutServerLoad = async ({ locals: { session }, url }) => {
  const proxyPrefix = resolveProxyPrefix(url.pathname)

  return {
    authBaseUrl: `${url.origin}${proxyPrefix}`,
    basePath: proxyPrefix,
    session,
  }
}
