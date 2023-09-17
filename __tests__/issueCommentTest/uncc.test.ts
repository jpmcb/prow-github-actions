import {setupServer} from 'msw/node'
import {rest} from 'msw'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import pullReviewRequested from '../fixtures/pullReq/pullReviewRequested.json'
import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import issueListComments from '../fixtures/issues/assign/issueListComments.json'

const server = setupServer()
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn'
  })
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('/uncc', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/uncc')
  })

  it('handles self uncc-ing with comment /uncc', async () => {
    issueCommentEvent.comment.body = '/uncc'

    server.use(
      rest.get(
        `${utils.api}/orgs/Codertocat/members/Codertocat`,
        utils.mockResponse(204)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(204)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/requested_reviewers`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      reviewers: ['Codertocat']
    })
  })

  it('handles uncc-ing another user with /uncc @username', async () => {
    issueCommentEvent.comment.body = '/uncc @some-user'

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
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/requested_reviewers`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      reviewers: ['some-user']
    })
  })

  it('handles uncc-ing another user with /uncc username', async () => {
    issueCommentEvent.comment.body = '/uncc some-user'

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
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/requested_reviewers`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      reviewers: ['some-user']
    })
  })

  it('handles uncc-ing multiple users', async () => {
    issueCommentEvent.comment.body = '/uncc @some-user @other-user'

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
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/requested_reviewers`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      reviewers: ['some-user', 'other-user']
    })
  })

  it('unccs user if they are an org member', async () => {
    issueCommentEvent.comment.body = '/uncc @some-user'

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
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/requested_reviewers`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      reviewers: ['some-user']
    })
  })

  it('uncc user if they are a repo collaborator', async () => {
    issueCommentEvent.comment.body = '/uncc @some-user'

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
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(404)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/requested_reviewers`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      reviewers: ['some-user']
    })
  })

  it('uncc user if they have previously commented', async () => {
    issueCommentEvent.comment.body = '/uncc @some-user'

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
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/comments`,
        utils.mockResponse(200, issueListComments)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/1/requested_reviewers`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      reviewers: ['some-user']
    })
  })
})
