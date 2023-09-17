import {setupServer} from 'msw/node'
import {rest} from 'msw'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import * as utils from '../testUtils'

import pullReqListReviews from '../fixtures/pullReq/pullReqListReviews.json'
import issueCommentEventAssign from '../fixtures/issues/assign/issueCommentEventAssign.json'

const server = setupServer()
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn'
  })
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('/approve', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/approve')
  })

  it('fails if commenter is not an approver in OWNERS', async () => {
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
    const wantErr = `Codertocat is not included in the approvers role in the OWNERS file`

    // Mock the reply that the user is not authorized
    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    issueCommentEventAssign.comment.body = '/approve'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body().body).toContain(wantErr)
  })

  it('fails if commenter is not an org member or collaborator', async () => {
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
        `${utils.api}/repos/Codertocat/Hello-World/contents/OWNERS`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/orgs/Codertocat/members/Codertocat`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(404)
      )
    )

    issueCommentEventAssign.comment.body = '/approve'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body().body).toContain(wantErr)
  })

  it('approves if commenter is an approver in OWNERS', async () => {
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

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/reviews`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    issueCommentEventAssign.comment.body = '/approve'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      event: 'APPROVE'
    })
  })

  it('approves if commenter is an org member', async () => {
    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/contents/OWNERS`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/orgs/Codertocat/members/Codertocat`,
        utils.mockResponse(204)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(404)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/reviews`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    issueCommentEventAssign.comment.body = '/approve'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      event: 'APPROVE'
    })
  })

  it('removes approval with the /approve cancel command if approver in OWNERS file', async () => {
    const owners = Buffer.from(
      `
    approvers:
    - some-user
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
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/reviews`,
        utils.mockResponse(200, pullReqListReviews)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.put(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/reviews/80/dismissals`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    issueCommentEventAssign.comment.body = '/approve cancel'
    issueCommentEventAssign.comment.user.login = 'some-user'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      message: `Canceled through prow-github-actions by @some-user`
    })
  })

  it('removes approval with the /approve cancel command if commenter is collaborator', async () => {
    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/contents/OWNERS`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/orgs/Codertocat/members/some-user`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/some-user`,
        utils.mockResponse(204)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/reviews`,
        utils.mockResponse(200, pullReqListReviews)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.put(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/reviews/80/dismissals`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    issueCommentEventAssign.comment.body = '/approve cancel'
    issueCommentEventAssign.comment.user.login = 'some-user'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      message: `Canceled through prow-github-actions by @some-user`
    })
  })
})
