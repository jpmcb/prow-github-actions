import nock from 'nock'

import * as utils from '../testUtils'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import issueUnassignedResp from '../fixtures/issues/unassign/issueUnassignedResponse.json'
import issueCommentEventUnassign from '../fixtures/issues/unassign/issueCommentEventUnassign.json'

describe('/unassign', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/unassign')
  })

  it('handles self unassignment with comment /unassign', async () => {
    nock(utils.api)
      .delete('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['Codertocat']
        })
        return true
      })
      .reply(201, issueUnassignedResp)

    const commentContext = new utils.mockContext(issueCommentEventUnassign)

    await handleIssueComment(commentContext)
    expect.assertions(1)
  })

  it('handles unassign another user with /unassign @username', async () => {
    issueCommentEventUnassign.comment.body = '/unassign @some-user'

    nock(utils.api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(utils.api)
      .delete('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['some-user']
        })
        return true
      })
      .reply(201, issueUnassignedResp)

    const commentContext = new utils.mockContext(issueCommentEventUnassign)

    await handleIssueComment(commentContext)
    expect.assertions(1)
  })

  it('handles unassigning another user with /unassign username', async () => {
    issueCommentEventUnassign.comment.body = '/unassign some-user'

    nock(utils.api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(utils.api)
      .delete('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['some-user']
        })
        return true
      })
      .reply(201, issueUnassignedResp)

    const commentContext = new utils.mockContext(issueCommentEventUnassign)

    await handleIssueComment(commentContext)
    expect.assertions(1)
  })

  it('handles unassigning multiple users', async () => {
    issueCommentEventUnassign.comment.body = '/unassign @some-user @other-user'

    nock(utils.api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(utils.api)
      .delete('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['some-user', 'other-user']
        })
        return true
      })
      .reply(201, issueUnassignedResp)

    const commentContext = new utils.mockContext(issueCommentEventUnassign)

    await handleIssueComment(commentContext)
    expect.assertions(1)
  })

  it('handles unassign another user if commenter is org member', async () => {
    issueCommentEventUnassign.comment.body = '/unassign @some-user'

    nock(utils.api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1/comments')
      .reply(404)

    nock(utils.api)
      .delete('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['some-user']
        })
        return true
      })
      .reply(201, issueUnassignedResp)

    const commentContext = new utils.mockContext(issueCommentEventUnassign)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  describe('error', () => {
    it('reply with error message if user not assigned', () => {
      // TODO
    })
  })
})
