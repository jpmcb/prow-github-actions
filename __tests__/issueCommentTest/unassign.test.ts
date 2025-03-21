import {setupServer} from 'msw/node'
import {rest} from 'msw'

import * as utils from '../testUtils'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import issueUnassignedResp from '../fixtures/issues/unassign/issueUnassignedResponse.json'
import issueCommentEventUnassign from '../fixtures/issues/unassign/issueCommentEventUnassign.json'

const server = setupServer()
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn'
  })
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('/unassign', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/unassign')
  })

  it('handles self unassignment with comment /unassign', async () => {
    const observeReq = new utils.observeRequest()
    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/assignees`,
        utils.mockResponse(201, issueUnassignedResp, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEventUnassign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      assignees: ['Codertocat']
    })
  })

  it('handles unassign another user with /unassign @username', async () => {
    issueCommentEventUnassign.comment.body = '/unassign @some-user'

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
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(404)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/assignees`,
        utils.mockResponse(201, issueUnassignedResp, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEventUnassign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      assignees: ['some-user']
    })
  })

  it('handles unassigning another user with /unassign username', async () => {
    issueCommentEventUnassign.comment.body = '/unassign some-user'

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
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(404)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/assignees`,
        utils.mockResponse(201, issueUnassignedResp, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEventUnassign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      assignees: ['some-user']
    })
  })

  it('handles unassigning multiple users', async () => {
    issueCommentEventUnassign.comment.body = '/unassign @some-user @other-user'

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
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(404)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/assignees`,
        utils.mockResponse(201, issueUnassignedResp, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEventUnassign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      assignees: ['some-user', 'other-user']
    })
  })

  it('handles unassign another user if commenter is org member', async () => {
    issueCommentEventUnassign.comment.body = '/unassign @some-user'

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
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(404)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/assignees`,
        utils.mockResponse(201, issueUnassignedResp, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEventUnassign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      assignees: ['some-user']
    })
  })

  describe('error', () => {
    xit('reply with error message if user not assigned', () => {
      // TODO
    })
  })
})
