import {setupServer} from 'msw/node'
import {rest} from 'msw'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueAssignedResp from '../fixtures/issues/assign/issueAssignedResponse.json'
import issueCommentEventAssign from '../fixtures/issues/assign/issueCommentEventAssign.json'
import issueListComments from '../fixtures/issues/assign/issueListComments.json'

const server = setupServer()
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn'
  })
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('/assign', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/assign')
  })

  it('handles self assigning with comment /assign', async () => {
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
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/assignees`,
        utils.mockResponse(201, issueAssignedResp, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      assignees: ['Codertocat']
    })
  })

  it('handles assigning another user with /assign @username', async () => {
    issueCommentEventAssign.comment.body = '/assign @some-user'

    server.use(
      rest.get(
        `${utils.api}/orgs/Codertocat/members/some-user`,
        utils.mockResponse(204)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/some-user`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(404)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/assignees`,
        utils.mockResponse(201, issueAssignedResp, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      assignees: ['some-user']
    })
  })

  it('handles assigning another user with /assign username', async () => {
    issueCommentEventAssign.comment.body = '/assign some-user'

    server.use(
      rest.get(
        `${utils.api}/orgs/Codertocat/members/some-user`,
        utils.mockResponse(204)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/some-user`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(404)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/assignees`,
        utils.mockResponse(201, issueAssignedResp, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      assignees: ['some-user']
    })
  })

  it('handles assigning multiple users', async () => {
    issueCommentEventAssign.comment.body = '/assign @some-user @other-user'

    server.use(
      rest.get(
        `${utils.api}/orgs/Codertocat/members/some-user`,
        utils.mockResponse(204)
      ),
      rest.get(
        `${utils.api}/orgs/Codertocat/members/other-user`,
        utils.mockResponse(204)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/some-user`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/other-user`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(404)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/assignees`,
        utils.mockResponse(201, issueAssignedResp, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      assignees: ['some-user', 'other-user']
    })
  })

  it('assigns user if they are an org member', async () => {
    issueCommentEventAssign.comment.body = '/assign @some-user'

    server.use(
      rest.get(
        `${utils.api}/orgs/Codertocat/members/some-user`,
        utils.mockResponse(204)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/some-user`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(404)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/assignees`,
        utils.mockResponse(201, issueAssignedResp, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      assignees: ['some-user']
    })
  })

  it('assigns user if they are a repo collaborator', async () => {
    issueCommentEventAssign.comment.body = '/assign @some-user'

    server.use(
      rest.get(
        `${utils.api}/orgs/Codertocat/members/some-user`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/some-user`,
        utils.mockResponse(204)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(404)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/assignees`,
        utils.mockResponse(201, issueAssignedResp, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      assignees: ['some-user']
    })
  })

  it('assigns user if they have previously commented', async () => {
    issueCommentEventAssign.comment.body = '/assign @some-user'

    server.use(
      rest.get(
        `${utils.api}/orgs/Codertocat/members/some-user`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/some-user`,
        utils.mockResponse(404)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(200, issueListComments)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/assignees`,
        utils.mockResponse(201, issueAssignedResp, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      assignees: ['some-user']
    })
  })
})
