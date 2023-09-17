import {setupServer} from 'msw/node'
import {rest} from 'msw'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import issuePayload from '../fixtures/issues/issue.json'

const server = setupServer()
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn'
  })
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('lgtm', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/lgtm')
  })

  it('labels the issue with the lgtm label', async () => {
    issueCommentEvent.comment.body = '/lgtm'
    const commentContext = new utils.mockContext(issueCommentEvent)

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/labels`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    server.use(
      rest.get(
        `${utils.api}/orgs/Codertocat/members/Codertocat`,
        utils.mockResponse(204)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/contents/OWNERS`,
        utils.mockResponse(404)
      )
    )

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      labels: ['lgtm']
    })
  })

  it('removes the lgtm label with /lgtm cancel', async () => {
    issueCommentEvent.comment.body = '/lgtm cancel'
    const commentContext = new utils.mockContext(issueCommentEvent)

    issuePayload.labels.push({
      id: 1,
      node_id: '123',
      url: 'https://api.github.com/repos/octocat/Hello-World/labels/lgtm',
      name: 'lgtm',
      description: 'looks good to me',
      color: 'f29513',
      default: true
    })

    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/labels/lgtm`,
        utils.mockResponse(200)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1`,
        utils.mockResponse(200, issuePayload)
      ),
      rest.get(
        `${utils.api}/orgs/Codertocat/members/Codertocat`,
        utils.mockResponse(204)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/contents/OWNERS`,
        utils.mockResponse(404)
      )
    )

    await handleIssueComment(commentContext)
  })

  it('adds label if commenter is collaborator', async () => {
    issueCommentEvent.comment.body = '/lgtm'
    const commentContext = new utils.mockContext(issueCommentEvent)

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/labels`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    server.use(
      rest.get(
        `${utils.api}/orgs/Codertocat/members/Codertocat`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(204)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/contents/OWNERS`,
        utils.mockResponse(404)
      )
    )

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      labels: ['lgtm']
    })
  })

  it('fails if commenter is not reviewer in OWNERS', async () => {
    const owners = Buffer.from(
      `
approvers:
- Codertocat
`
    ).toString('base64')

    const contentResponse = {
      type: 'file',
      encoding: 'base64',
      size: 4096,
      name: 'OWNERS',
      path: 'OWNERS',
      content: owners
    }

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/contents/OWNERS`,
        utils.mockResponse(200, contentResponse)
      )
    )

    const wantErr = `Codertocat is not included in the reviewers role in the OWNERS file`

    // Mock the reply that the user is not authorized
    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    issueCommentEvent.comment.body = '/lgtm'
    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body().body).toContain(wantErr)
  })

  it('fails if commenter is not org member or collaborator', async () => {
    const wantErr = `Codertocat is not a org member or collaborator`

    // Mock the reply that the user is not authorized
    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    server.use(
      rest.get(
        `${utils.api}/orgs/Codertocat/members/Codertocat`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/contents/OWNERS`,
        utils.mockResponse(404)
      )
    )

    issueCommentEvent.comment.body = '/lgtm'
    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body().body).toContain(wantErr)
  })

  it('adds label if commenter is reviewer in OWNERS', async () => {
    issueCommentEvent.comment.body = '/lgtm'
    const commentContext = new utils.mockContext(issueCommentEvent)

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/labels`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const owners = Buffer.from(
      `
reviewers:
- Codertocat
`
    ).toString('base64')

    const contentResponse = {
      type: 'file',
      encoding: 'base64',
      size: 4096,
      name: 'OWNERS',
      path: 'OWNERS',
      content: owners
    }

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/contents/OWNERS`,
        utils.mockResponse(200, contentResponse)
      )
    )

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      labels: ['lgtm']
    })
  })
})
