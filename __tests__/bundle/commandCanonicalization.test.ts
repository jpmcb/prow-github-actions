import type { FakeGithub } from './fakeGithub'
import { Buffer } from 'node:buffer'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { start } from './fakeGithub'
import { comment, configReads, helpersFor, repo, repoLabels, token } from './helpers'
import { runBundle } from './runBundle'

vi.setConfig({ testTimeout: 30_000 })

// the `prow-commands` input's canonicalization in handleIssueComment: a Prow-style alias
// (/remove-help) names its canonical command's module, a /remove-<key> whose base is no built-in
// command names the `<key>` label section and enables the whole /<key> family, and a configured
// name no module serves fails the run
describe('dist/index.js prow-commands canonicalization', () => {
  const labelsRead = `GET ${repo}/labels?per_page=100`
  const labelPost = `POST ${repo}/issues/1/labels`
  let gh: FakeGithub
  const { calls, expectRequests } = helpersFor(() => gh)

  beforeAll(async () => {
    gh = await start()
  })
  afterEach(() => gh.reset())
  afterAll(() => gh.close())

  function routeHelp() {
    gh.route('GET', `${repo}/labels`, { status: 200, body: [{ name: 'help wanted' }] })
    gh.route('POST', `${repo}/issues/1/labels`, { status: 200, body: [] })
  }

  async function run(body: string, commands: string) {
    return runBundle({
      eventName: 'issue_comment',
      payload: comment(body),
      inputs: { ...token, 'prow-commands': commands },
      apiUrl: gh.url,
    })
  }

  it('a configured /remove-help alias runs the /help module: /help adds help wanted', async () => {
    routeHelp()

    const result = await run('/help', '/remove-help')

    expect(result.status, result.stdout).toBe(0)
    expect(result.errors).toEqual([])
    const posts = gh.requestsMatching('POST', /\/issues\/1\/labels$/)
    expect(posts).toHaveLength(1)
    expect(posts[0].body).toEqual({ labels: ['help wanted'] })
    expectRequests(configReads(), [labelsRead, labelPost])
  })

  it('configuring only /remove-triage enables the dynamic /triage family: /triage accepted adds triage/accepted', async () => {
    const config = 'labels:\n  triage:\n    values: [accepted]\n'
    gh.route('GET', `${repo}/contents/${encodeURIComponent('.github/prow.yaml')}`, { status: 200, body: { type: 'file', encoding: 'base64', content: Buffer.from(config).toString('base64') } })
    gh.route('GET', `${repo}/labels`, repoLabels('triage/accepted'))
    gh.route('POST', `${repo}/issues/1/labels`, { status: 200, body: [] })

    const result = await run('/triage accepted', '/remove-triage')

    expect(result.status, result.stdout).toBe(0)
    expect(result.errors).toEqual([])
    const posts = gh.requestsMatching('POST', /\/issues\/1\/labels$/)
    expect(posts).toHaveLength(1)
    expect(posts[0].body).toEqual({ labels: ['triage/accepted'] })
    expectRequests(configReads({ repo: '.github/prow.yaml' }), [labelsRead, labelPost])
  })

  it('a configured command no module serves fails the run naming it and makes no api call', async () => {
    const result = await run('/foo_bar', '/foo_bar')

    expect(result.status, result.stdout).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('could not execute /foo_bar')
    expect(calls()).toEqual([])
  })
})
