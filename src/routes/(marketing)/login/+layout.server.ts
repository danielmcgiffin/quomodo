import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({
  locals: { session },
  url,
}) => {
  return {
    url: url.origin,
    session,
  }
}
