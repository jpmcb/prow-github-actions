import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import pullReviewRequested from '../fixtures/pullReq/pullReviewRequested.json'
import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import issueListComments from '../fixtures/issues/assign/issueListComments.json'

nock.disableNetConnect()

describe('/cc', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/cc')
  })

  it('handles self cc-ing with comment /cc', async () => {
    issueCommentEvent.comment.body = '/cc'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(204)

    nock(utils.api)
      .post('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['Codertocat']
        })
        return true
      })
      .reply(201, pullReviewRequested)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('handles cc-ing another user with /cc @username', async () => {
    issueCommentEvent.comment.body = '/cc @some-user'

    nock(utils.api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(utils.api)
      .post('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['some-user']
        })
        return true
      })
      .reply(201, pullReviewRequested)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('handles cc-ing another user with /cc username', async () => {
    issueCommentEvent.comment.body = '/cc some-user'

    nock(utils.api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(utils.api)
      .post('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['some-user']
        })
        return true
      })
      .reply(201, pullReviewRequested)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('handles cc-ing multiple users', async () => {
    issueCommentEvent.comment.body = '/cc @some-user @other-user'

    nock(utils.api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(204)

    nock(utils.api)
      .get('/orgs/Codertocat/members/other-user')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(utils.api)
      .post('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['some-user', 'other-user']
        })
        return true
      })
      .reply(201, pullReviewRequested)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('ccs user if they are an org member', async () => {
    issueCommentEvent.comment.body = '/cc @some-user'

    nock(utils.api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(utils.api)
      .post('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['some-user']
        })
        return true
      })
      .reply(201, pullReviewRequested)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('assigns user if they are a repo collaborator', async () => {
    issueCommentEvent.comment.body = '/cc @some-user'

    nock(utils.api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(utils.api)
      .post('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['some-user']
        })
        return true
      })
      .reply(201, pullReviewRequested)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('assigns user if they have previously commented', async () => {
    issueCommentEvent.comment.body = '/cc @some-user'

    nock(utils.api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(200, issueListComments)

    nock(utils.api)
      .post('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['some-user']
        })
        return true
      })
      .reply(201, pullReviewRequested)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })
})
