// Preloaded after catApiPreload.cjs by the /meow cancel-rejection e2e test. Keeps the
// CAT_API_URL rewrite and the stub server's status and headers, but hands the bundle a
// Response whose body stream refuses to be cancelled, so `response.body.cancel()` rejects.
// Only a real http body cannot be made to do this on demand; everything else is untouched.
'use strict'

require('./catApiPreload.cjs')

const catApiOrigin = 'https://api.thecatapi.com'
const stubbedFetch = globalThis.fetch

globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const response = await stubbedFetch(input, init)
  if (!url.startsWith(catApiOrigin))
    return response
  await response.body?.cancel()
  const body = new ReadableStream({
    cancel() {
      throw new Error('cancel refused')
    },
  })
  return new Response(body, { status: response.status, headers: response.headers })
}
