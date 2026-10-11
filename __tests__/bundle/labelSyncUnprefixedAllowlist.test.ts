import type { FakeGithub } from './fakeGithub'
import { Buffer } from 'node:buffer'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'
import { start } from './fakeGithub'
import { configReads, helpersFor, repo, token } from './helpers'
import { runBundle } from './runBundle'

vi.setConfig({ testTimeout: 30_000 })

const labelsRead = `GET ${repo}/labels?per_page=100`

function yamlFile(text: string) {
  const file = structuredClone(labelFileContents)
  file.content = Buffer.from(text).toString('base64')
  return file
}

// the `/label` allowlist is the one registry section with an empty prefix (prefix: '' in
// src/labels/prefixed.ts): the catalog must emit its values verbatim, never as `labels/<value>`
describe('dist/index.js label-sync with the /label allowlist', () => {
  let gh: FakeGithub
  const { expectRequests } = helpersFor(() => gh)

  beforeAll(async () => {
    gh = await start()
  })
  afterEach(() => gh.reset())
  afterAll(() => gh.close())

  it('creates the labels section values unprefixed while a prefixed section keeps its prefix', async () => {
    const config = yamlFile([
      'labels:',
      '  kind: [bug]',
      '  labels:',
      '    - documentation',
      '    - name: question',
      '      color: D876E3',
      '      description: Further information is requested',
      '',
    ].join('\n'))
    gh.route('GET', '/repos/Codertocat/.project/contents/prow.yaml', { status: 200, body: config })
    gh.route('GET', `${repo}/labels`, { status: 200, body: [] })
    gh.route('POST', `${repo}/labels`, { status: 201, body: {} })

    const result = await runBundle({
      eventName: 'workflow_dispatch',
      payload: {},
      inputs: { ...token, jobs: 'label-sync' },
      apiUrl: gh.url,
    })

    expect(result.status, result.stdout).toBe(0)
    expect(result.errors).toEqual([])
    const posts = gh.requestsMatching('POST', /\/labels$/)
    const names = posts.map(p => (p.body as { name: string }).name)
    expect(names).toContain('documentation')
    expect(names).toContain('question')
    expect(names).toContain('kind/bug')
    expect(names.some(name => name.startsWith('labels/'))).toBe(false)
    expect(posts.find(p => (p.body as { name: string }).name === 'documentation')!.body).toEqual({ name: 'documentation' })
    expect(posts.find(p => (p.body as { name: string }).name === 'question')!.body).toEqual({
      name: 'question',
      color: 'd876e3',
      description: 'Further information is requested',
    })
    expect(result.stdout).toContain(`label-sync: created ${names.length} [${names.join(', ')}], updated 0 [], unchanged 0, failed 0`)
    expectRequests([...configReads({ org: '.project' }), labelsRead], names.map(() => `POST ${repo}/labels`))
  })
})
