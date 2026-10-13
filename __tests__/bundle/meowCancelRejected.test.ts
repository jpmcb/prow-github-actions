import type { AddressInfo } from 'node:net'
import type { FakeGithub } from './fakeGithub'
import http from 'node:http'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { start } from './fakeGithub'
import { comment, helpersFor, repo, token } from './helpers'
import { runBundle } from './runBundle'

vi.setConfig({ testTimeout: 30_000 })

const preload = path.resolve(__dirname, 'catApiCancelRejectsPreload.cjs')
const fallback = 'The cat API is unavailable right now.'

// a stand-in for api.thecatapi.com that answers every request with one fixed status
async function startCatApi(status: number) {
  let requests = 0
  const server = http.createServer((_req, res) => {
    requests++
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end('{}')
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${port}`,
    get requests() {
      return requests
    },
    reset() {
      requests = 0
    },
    close: () => new Promise<void>((resolve, reject) => server.close(e => (e ? reject(e) : resolve()))),
  }
}

describe('dist/index.js issue_comment /meow when the cat api body refuses to cancel', () => {
  let gh: FakeGithub
  let cat: Awaited<ReturnType<typeof startCatApi>>
  const { calls } = helpersFor(() => gh)

  beforeAll(async () => {
    gh = await start()
    cat = await startCatApi(404)
  })
  afterEach(() => {
    gh.reset()
    cat.reset()
  })
  afterAll(async () => {
    await gh.close()
    await cat.close()
  })

  it('logs the cancel failure at debug, keeps the 4xx verdict, and still posts the unavailable note', async () => {
    gh.route('POST', `${repo}/issues/1/comments`, { status: 201, body: {} })

    const result = await runBundle({
      eventName: 'issue_comment',
      payload: comment('/meow'),
      inputs: { ...token, 'prow-commands': '/meow' },
      apiUrl: gh.url,
      env: { NODE_OPTIONS: `--require "${preload}"`, CAT_API_URL: cat.url },
    })

    expect(result.status, result.stdout).toBe(0)
    expect(result.errors).toEqual([])
    expect(cat.requests).toBe(1)
    expect(result.stdout).toMatch(/^::debug::could not cancel cat api response body: Error: cancel refused$/m)
    expect(result.stdout).toMatch(/::warning::Could not fetch a cat image: Error: cat api responded with 404/)
    expect(calls()).toEqual([`POST ${repo}/issues/1/comments`])
    expect(gh.requestsMatching('POST', /\/issues\/1\/comments$/).map(r => (r.body as { body: string }).body)).toEqual([fallback])
  })
})
