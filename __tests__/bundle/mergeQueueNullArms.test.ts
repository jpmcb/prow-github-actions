import type { FakeGithub } from './fakeGithub'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import pullReqListPulls from '../fixtures/pullReq/pullReqListPulls.json'
import pullReqOpenedEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'
import { start } from './fakeGithub'
import { configReads, helpersFor, ownersProbe, queueRead, repo, token } from './helpers'
import { runBundle } from './runBundle'

vi.setConfig({ testTimeout: 30_000 })

// the merge-queue answers the shared fixture never gives: an enqueue mutation whose
// `mergeQueueEntry` is null, a queue entry whose `enqueuer` is null, and a GraphQL
// response carrying an empty `errors` array — driven through dist/index.js
describe('dist/index.js on a merge queue that answers without an entry, enqueuer or error message', () => {
  let gh: FakeGithub
  const { expectRequests } = helpersFor(() => gh)

  const pullRead = `GET ${repo}/pulls/1`
  const head = pullReqOpenedEvent.pull_request.head.sha
  const bind = `POST ${repo}/statuses/${head}`
  const bindingRead = `GET ${repo}/commits/${head}/status?per_page=100`
  const bound = [{ context: 'prow/lgtm', state: 'success' }]
  const nodeId = 'PR_kwDOtest'

  beforeAll(async () => {
    gh = await start()
  })
  afterEach(() => gh.reset())
  afterAll(() => gh.close())

  function mergeablePr(labels: string[] = ['lgtm']) {
    const pr = structuredClone(pullReqListPulls[0])
    return { ...pr, number: 1, labels: labels.map(name => ({ name })), mergeable: true, mergeable_state: 'clean', head: { sha: head } }
  }

  function stateAnswer(overrides: Record<string, unknown> = {}) {
    return { status: 200, body: { data: { repository: { pullRequest: { id: nodeId, headRefOid: head, isMergeQueueEnabled: true, isInMergeQueue: false, mergeQueueEntry: null, ...overrides } } } } }
  }

  function graphql(onEnqueue: { status: number, body: unknown }, state = stateAnswer()) {
    gh.route('POST', '/graphql', (req) => {
      const query = String((req.body as { query?: string } | undefined)?.query ?? '')
      return query.includes('enqueuePullRequest') ? onEnqueue : state
    })
  }

  function labeledLgtm() {
    gh.commitStatuses(repo, head, bound)
    return runBundle({
      eventName: 'pull_request',
      payload: { ...pullReqOpenedEvent, action: 'labeled', label: { name: 'lgtm' } },
      inputs: token,
      apiUrl: gh.url,
    })
  }

  function unlabeledLgtm() {
    return runBundle({
      eventName: 'pull_request',
      payload: { ...pullReqOpenedEvent, action: 'unlabeled', label: { name: 'lgtm' } },
      inputs: token,
      apiUrl: gh.url,
    })
  }

  it('an enqueue accepted without a mergeQueueEntry is logged as enqueued with no position', async () => {
    gh.route('GET', `${repo}/pulls/1`, { status: 200, body: mergeablePr() })
    graphql({ status: 200, body: { data: { enqueuePullRequest: { mergeQueueEntry: null } } } })

    const result = await labeledLgtm()

    expect(result.status, result.stdout).toBe(0)
    expect(result.errors).toEqual([])
    expect(result.stdout).toContain('enqueued pr #1\n')
    expect(result.stdout).not.toContain('(position')
    expect(gh.graphqlCalls('enqueuePullRequest')).toHaveLength(1)
    expect(gh.requestsMatching('PUT', /./)).toEqual([])
    expectRequests(configReads(), [bind, pullRead, ownersProbe, bindingRead, queueRead, queueRead])
  })

  it('pull_request unlabeled lgtm on a queue entry without an enqueuer: left in the queue as an unknown actor', async () => {
    gh.route('GET', `${repo}/pulls/1`, { status: 200, body: mergeablePr([]) })
    graphql({ status: 500, body: { message: 'unexpected enqueue' } }, stateAnswer({ isInMergeQueue: true, mergeQueueEntry: { state: 'QUEUED', position: 1, enqueuer: null } }))

    const result = await unlabeledLgtm()

    expect(result.status, result.stdout).toBe(0)
    expect(result.errors).toEqual([])
    expect(result.stdout).toContain('::debug::pr #1 was enqueued by an unknown actor; leaving it in the queue')
    expect(result.stdout).not.toContain('(dequeued)')
    expect(gh.graphqlCalls('dequeuePullRequest')).toEqual([])
    expect(gh.graphqlCalls('enqueuePullRequest')).toEqual([])
    expectRequests(configReads(), [pullRead, ownersProbe, queueRead])
  })

  it('an enqueue refused with an empty errors array fails the run with the client\'s own message', async () => {
    gh.route('GET', `${repo}/pulls/1`, { status: 200, body: mergeablePr() })
    graphql({ status: 200, body: { data: null, errors: [] } })

    const result = await labeledLgtm()

    expect(result.status, result.stdout).toBe(1)
    // no error message to join: the GraphQL client's own summary line is what is reported
    expect(result.errors.some(e => e.includes('could not enqueue pr #1: Request failed due to following response errors:'))).toBe(true)
    expect(result.errors.some(e => e.includes('could not merge pull request(s) #1'))).toBe(true)
    expect(gh.graphqlCalls('enqueuePullRequest')).toHaveLength(1)
    expect(gh.requestsMatching('PUT', /./)).toEqual([])
    expectRequests(configReads(), [bind, pullRead, ownersProbe, bindingRead, queueRead, queueRead])
  })
})
