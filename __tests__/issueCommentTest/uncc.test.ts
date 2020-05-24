import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import pullReviewRequested from '../fixtures/pullReq/pullReviewRequested.json'
import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import issueListComments from '../fixtures/issues/assign/issueListComments.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('/uncc', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/uncc')
  })

  it('handles self uncc-ing with comment /uncc', async () => {
    issueCommentEvent.comment.body = '/uncc'

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(204)

    nock(api)
      .delete('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['Codertocat']
        })
        return true
      })
      .reply(200)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('handles uncc-ing another user with /uncc @username', async () => {
    issueCommentEvent.comment.body = '/uncc @some-user'

    nock(api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(204)

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(api)
      .delete('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['some-user']
        })
        return true
      })
      .reply(200)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('handles uncc-ing another user with /uncc username', async () => {
    issueCommentEvent.comment.body = '/uncc some-user'

    nock(api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(204)

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(api)
      .delete('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['some-user']
        })
        return true
      })
      .reply(200)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('handles uncc-ing multiple users', async () => {
    issueCommentEvent.comment.body = '/uncc @some-user @other-user'

    nock(api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(204)

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(api)
      .delete('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['some-user', 'other-user']
        })
        return true
      })
      .reply(201)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('unccs user if they are an org member', async () => {
    issueCommentEvent.comment.body = '/uncc @some-user'

    nock(api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(204)

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(api)
      .delete('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['some-user']
        })
        return true
      })
      .reply(200)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('assigns user if they are a repo collaborator', async () => {
    issueCommentEvent.comment.body = '/uncc @some-user'

    nock(api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(204)

    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(api)
      .delete('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['some-user']
        })
        return true
      })
      .reply(200)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('assigns user if they have previously commented', async () => {
    issueCommentEvent.comment.body = '/uncc @some-user'

    nock(api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(200, issueListComments)

    nock(api)
      .delete('/repos/Codertocat/Hello-World/pulls/1/requested_reviewers', body => {
        expect(body).toMatchObject({
          reviewers: ['some-user']
        })
        return true
      })
      .reply(200)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })
})
