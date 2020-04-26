import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueAssignedResp from '../fixtures/issues/assign/issueAssignedResponse.json'
import issueCommentEventAssign from '../fixtures/issues/assign/issueCommentEventAssign.json'
import issueListComments from '../fixtures/issues/assign/issueListComments.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('/assign', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/assign')
  })

  it('handles self assigning with comment /assign', async () => {
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
      .post('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['Codertocat']
        })
        return true
      })
      .reply(201, issueAssignedResp)

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('handles assigning another user with /assign @username', async () => {
    issueCommentEventAssign.comment.body = '/assign @some-user'

    nock(api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(204)

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(api)
      .post('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['some-user']
        })
        return true
      })
      .reply(201, issueAssignedResp)

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('handles assigning another user with /assign username', async () => {
    issueCommentEventAssign.comment.body = '/assign some-user'

    nock(api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(204)

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(api)
      .post('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['some-user']
        })
        return true
      })
      .reply(201, issueAssignedResp)

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('handles assigning multiple users', async () => {
    issueCommentEventAssign.comment.body = '/assign @some-user @other-user'

    nock(api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(204)

    nock(api)
      .get('/orgs/Codertocat/members/other-user')
      .reply(204)

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(api)
      .post('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['some-user', 'other-user']
        })
        return true
      })
      .reply(201, issueAssignedResp)

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('assigns user if they are an org member', async () => {
    issueCommentEventAssign.comment.body = '/assign @some-user'

    nock(api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(204)

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(api)
      .post('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['some-user']
        })
        return true
      })
      .reply(201, issueAssignedResp)

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('assigns user if they are a repo collaborator', async () => {
    issueCommentEventAssign.comment.body = '/assign @some-user'

    nock(api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(204)

    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(api)
      .post('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['some-user']
        })
        return true
      })
      .reply(201, issueAssignedResp)

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('assigns user if they have previously commented', async () => {
    issueCommentEventAssign.comment.body = '/assign @some-user'

    nock(api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(404)

    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(200, issueListComments)

    nock(api)
      .post('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['some-user']
        })
        return true
      })
      .reply(201, issueAssignedResp)

    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })
})
