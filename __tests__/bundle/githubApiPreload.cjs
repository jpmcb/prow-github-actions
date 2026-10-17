// Preloaded into the bundle child with `NODE_OPTIONS=--require` by the GITHUB_API_URL fallback e2e test.
// Rewrites requests for the public api.github.com origin to the fake GitHub named by FAKE_GITHUB_URL and
// leaves every other fetch (and every option: headers, method, body, signal) untouched.
// Fails closed: without FAKE_GITHUB_URL an api.github.com request throws instead of leaving the test.
'use strict'

const githubApiOrigin = 'https://api.github.com'
const fakeUrl = process.env.FAKE_GITHUB_URL
const realFetch = globalThis.fetch

globalThis.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (url.startsWith(githubApiOrigin)) {
    if (!fakeUrl)
      throw new Error(`githubApiPreload: FAKE_GITHUB_URL is unset, refusing to call ${url}`)
    return realFetch(fakeUrl + url.slice(githubApiOrigin.length), init)
  }
  return realFetch(input, init)
}
