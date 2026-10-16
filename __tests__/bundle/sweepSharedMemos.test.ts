import type { FakeGithub } from './fakeGithub'
import { Buffer } from 'node:buffer'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'
import pullReqListPulls from '../fixtures/pullReq/pullReqListPulls.json'
import { blobSha, pullBody } from '../utils/ownersData'
import { start } from './fakeGithub'
import { repo, token } from './helpers'
import { runBundle } from './runBundle'

vi.setConfig({ testTimeout: 30_000 })

// the per-process memos the sweep shares between pull requests, driven through dist/index.js: the token's
// identity (approveReview.ts tokenIdentity, read once for `approve.github_review`) and the tip of the base
// branch (pullRequestOwners.ts baseBranchTip, read once per branch). A single event only ever asks for each
// once, so the memo-hit arms are reachable only from a sweep over two pull requests sharing a base branch.
describe('dist/index.js schedule sweep job shared memos', () => {
  let gh: FakeGithub

  const ownersFiles: Record<string, string> = { 'sdk/OWNERS': 'approvers:\n- bob\n' }
  const approveComment = { id: 1, body: '/approve', user: { login: 'bob', type: 'User' }, created_at: '2024-01-01T00:00:01Z' }

  beforeAll(async () => {
    gh = await start()
  })
  afterEach(() => gh.reset())
  afterAll(() => gh.close())

  function runSweep() {
    return runBundle({ eventName: 'schedule', payload: {}, inputs: { ...token, jobs: 'sweep' }, apiUrl: gh.url })
  }

  // an open pull request on master, opened before the window so blunderbuss has nothing to do
  function listedPr(number: number) {
    return {
      ...structuredClone(pullReqListPulls[0]),
      number,
      labels: [],
      created_at: '2011-01-26T19:01:12Z',
      updated_at: new Date().toISOString(),
      requested_reviewers: [],
      assignees: [],
      draft: false,
      mergeable: true,
      mergeable_state: 'clean',
      user: { login: 'dave' },
      head: { sha: `sha${number}`, repo: { full_name: 'dave/Hello-World' } },
      base: { ref: 'master', sha: 'basesha' },
    }
  }

  // two pull requests on master in a repository with OWNERS files, with `approve.github_review` on and `user`
  // as what GET /user answers for the token
  function routeSweep(user: { status: number, body: unknown }) {
    const pulls = [listedPr(1), listedPr(2)]
    const config = structuredClone(labelFileContents)
    config.content = Buffer.from('approve:\n  github_review: true\n').toString('base64')
    gh.route('GET', `${repo}/contents/.github%2Fprow.yaml`, { status: 200, body: config })
    gh.route('GET', '/user', user)
    gh.route('GET', repo, { status: 200, body: { default_branch: 'master' } })
    gh.route('GET', new RegExp(`^${repo}/pulls\\?`), (req) => {
      const page = new URL(req.path, gh.url).searchParams.get('page')
      return { status: 200, body: page === '1' ? pulls : [] }
    })
    gh.route('GET', new RegExp(`^${repo}/pulls/\\d+$`), (req) => {
      const number = Number(req.path.slice(req.path.lastIndexOf('/') + 1))
      return { status: 200, body: { ...pullBody, ...pulls.find(p => p.number === number), user: { login: 'dave' } } }
    })
    gh.route('GET', new RegExp(`^${repo}/pulls/\\d+/files`), { status: 200, body: [{ filename: 'sdk/x.go', status: 'modified' }] })
    gh.route('GET', `${repo}/branches/master`, { status: 200, body: { name: 'master', commit: { sha: 'basesha' } } })
    const tree = Object.keys(ownersFiles).map(path => ({ path, type: 'blob', sha: blobSha(path) }))
    gh.route('GET', `${repo}/git/trees/master`, { status: 200, body: { sha: 'master', truncated: false, tree } })
    gh.route('GET', `${repo}/git/trees/basesha`, { status: 200, body: { sha: 'basesha', truncated: false, tree } })
    for (const [path, contents] of Object.entries(ownersFiles)) {
      gh.route('GET', `${repo}/git/blobs/${blobSha(path)}`, { status: 200, body: { encoding: 'base64', content: Buffer.from(contents).toString('base64') } })
    }
    gh.route('GET', new RegExp(`^${repo}/issues/\\d+$`), { status: 200, body: { labels: [] } })
    gh.route('GET', `${repo}/labels`, { status: 200, body: [{ name: 'approved' }, { name: 'lgtm' }] })
    gh.route('POST', new RegExp(`^${repo}/issues/\\d+/labels$`), { status: 200, body: [] })
    gh.route('GET', new RegExp(`^${repo}/issues/\\d+/comments`), { status: 200, body: [approveComment] })
    gh.route('POST', new RegExp(`^${repo}/issues/\\d+/comments$`), { status: 201, body: {} })
    gh.route('GET', new RegExp(`^${repo}/pulls/\\d+/reviews`), { status: 200, body: [] })
    gh.route('POST', new RegExp(`^${repo}/pulls/\\d+/reviews$`), { status: 200, body: { id: 9 } })
    gh.route('GET', '/repos/Codertocat/.project/contents/prow.yaml', { status: 404, body: { message: 'Not Found' } })
  }

  function reads(pathRegex: RegExp) {
    return gh.requestsMatching('GET', pathRegex).map(r => `GET ${r.path}`)
  }

  it('two pull requests on one base branch: GET /user and the branch tip are each read once, and both are approved', async () => {
    routeSweep({ status: 200, body: { login: 'prow-bot' } })

    const result = await runSweep()

    expect(result.status, result.stdout).toBe(0)
    expect(result.errors).toEqual([])
    expect(result.stdout).toContain('sweep: 2 candidates updated since')
    expect(result.stdout).toContain('sweep: #1 evaluated')
    expect(result.stdout).toContain('sweep: #2 evaluated')
    // each pull request read its own changed files; the identity and the tip were shared
    expect(reads(/\/pulls\/\d+\/files/).sort()).toEqual([`GET ${repo}/pulls/1/files?per_page=100`, `GET ${repo}/pulls/2/files?per_page=100`])
    expect(reads(/^\/user$/)).toEqual(['GET /user'])
    expect(reads(/\/branches\/master$/)).toEqual([`GET ${repo}/branches/master`])
    expect(gh.requestsMatching('POST', /\/issues\/\d+\/labels$/).map(r => r.body)).toEqual([{ labels: ['approved'] }, { labels: ['approved'] }])
    expect(gh.requestsMatching('POST', /\/pulls\/\d+\/reviews$/)).toHaveLength(2)
  })
})
