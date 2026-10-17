import type { FakeGithub } from './fakeGithub'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { start } from './fakeGithub'
import { comment, configReads, helpersFor, repo, token } from './helpers'
import { runBundle } from './runBundle'

vi.setConfig({ testTimeout: 30_000 })

const preload = path.resolve(__dirname, 'githubApiPreload.cjs')
const issueRead = `GET ${repo}/issues/1`

// newOctokit (src/utils/octokit.ts) falls back to https://api.github.com when the runner leaves GITHUB_API_URL
// unset or empty. Every other bundle test points GITHUB_API_URL at the fake, so the fallback arm only runs here:
// the child gets an empty GITHUB_API_URL and a preload that redirects the public origin to the fake server.
describe('dist/index.js with an empty GITHUB_API_URL', () => {
  let gh: FakeGithub
  const { expectRequests } = helpersFor(() => gh)

  beforeAll(async () => {
    gh = await start()
  })
  afterEach(() => gh.reset())
  afterAll(() => gh.close())

  function run(apiUrl: string, extraEnv: Record<string, string> = {}) {
    return runBundle({
      eventName: 'issue_comment',
      payload: comment('/remove-help'),
      inputs: { ...token, 'prow-commands': '/help' },
      apiUrl: gh.url,
      env: { GITHUB_API_URL: apiUrl, ...extraEnv },
    })
  }

  it('talks to api.github.com, so /remove-help reaches the API through the fallback base URL', async () => {
    gh.route('GET', `${repo}/issues/1`, { status: 200, body: { labels: [{ name: 'help wanted' }] } })
    gh.route('DELETE', `${repo}/issues/1/labels/help%20wanted`, { status: 200, body: [] })

    const result = await run('', { NODE_OPTIONS: `--require "${preload}"`, FAKE_GITHUB_URL: gh.url })

    expect(result.status, result.stdout).toBe(0)
    expect(result.errors).toEqual([])
    expectRequests(configReads(), [issueRead, `DELETE ${repo}/issues/1/labels/help%20wanted`])
  })

  it('fails the run before any request when the preload has no fake to redirect to', async () => {
    const result = await run('', { NODE_OPTIONS: `--require "${preload}"` })

    expect(result.status, result.stdout).toBe(1)
    expect(result.errors.some(e => e.includes('FAKE_GITHUB_URL is unset'))).toBe(true)
    expect(gh.requests).toEqual([])
  })
})
