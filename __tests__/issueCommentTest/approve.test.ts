import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import { approve } from '../../src/issueComment/approve'

import * as utils from '../testUtils'

import pullReqListReviews from '../fixtures/pullReq/pullReqListReviews.json'
import issueCommentEventAssign from '../fixtures/issues/assign/issueCommentEventAssign.json'

jest.mock('fs')
import fs from 'fs'

nock.disableNetConnect()

describe('/approve', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/approve')
  })
  afterEach(()=>{
    if (!nock.isDone()) {
      throw new Error(
        `Not all nock interceptors were used: ${JSON.stringify(
          nock.pendingMocks()
        )}`
      )
    }
  })
  
  it('throws if commenter is not an approver in OWNERS', async () => {
    const owners = `
reviewers:
- Codertocat
`
   
    fs.readFileSync = jest.fn();
    (fs.readFileSync as jest.Mock).mockReturnValue(owners)
    fs.existsSync = jest.fn();
    (fs.existsSync as jest.Mock).mockReturnValue(true)

    issueCommentEventAssign.comment.body = '/approve'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    expect(() => approve(commentContext))
      .rejects.toThrowError('user not included in the approvers role in the OWNERS file')
  })

  it('throws if commenter is not an org member or collaborator', async () => {
    issueCommentEventAssign.comment.body = '/approve'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    expect(() => approve(commentContext))
      .rejects.toThrowError('user is not a org member or collaborator')
  })

  it('approves if commenter is an approver in OWNERS', async () => {
    const owners = `
approvers:
- Codertocat
`
   
    fs.readFileSync = jest.fn();                
    (fs.readFileSync as jest.Mock).mockReturnValue(owners)
    fs.existsSync = jest.fn();
    (fs.existsSync as jest.Mock).mockReturnValue(true)

    nock(utils.api)
      .post('/repos/Codertocat/Hello-World/pulls/1/reviews', body => {
        expect(body).toMatchObject({
          event: 'APPROVE'
        })
        return true
      })
      .reply(200)

    issueCommentEventAssign.comment.body = '/approve'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
  })

  it('approves if commenter is an org member', async () => {
    nock(utils.api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    nock(utils.api)
      .post('/repos/Codertocat/Hello-World/pulls/1/reviews', body => {
        expect(body).toMatchObject({
          event: 'APPROVE'
        })
        return true
      })
      .reply(200)

    issueCommentEventAssign.comment.body = '/approve'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
  })

  it('removes approval with the /approve cancel command if approver in OWNERS file', async () => {
    const owners = `
approvers:
- some-user
`
   
    fs.readFileSync = jest.fn();                
    (fs.readFileSync as jest.Mock).mockReturnValue(owners)
    fs.existsSync = jest.fn();
    (fs.existsSync as jest.Mock).mockReturnValue(true)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls/1/reviews')
      .reply(200, pullReqListReviews)

    nock(utils.api)
      .put(
        '/repos/Codertocat/Hello-World/pulls/1/reviews/80/dismissals',
        body => {
          expect(body).toMatchObject({
            message: `Canceled through prow-github-actions by @some-user`
          })
          return true
        }
      )
      .reply(200)

    issueCommentEventAssign.comment.body = '/approve cancel'
    issueCommentEventAssign.comment.user.login = 'some-user'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
  })

  it('removes approval with the /approve cancel command if commenter is collaborator', async () => {
    nock(utils.api)
      .get('/orgs/Codertocat/members/some-user')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/some-user')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls/1/reviews')
      .reply(200, pullReqListReviews)

    nock(utils.api)
      .put(
        '/repos/Codertocat/Hello-World/pulls/1/reviews/80/dismissals',
        body => {
          expect(body).toMatchObject({
            message: `Canceled through prow-github-actions by @some-user`
          })
          return true
        }
      )
      .reply(200)

    issueCommentEventAssign.comment.body = '/approve cancel'
    issueCommentEventAssign.comment.user.login = 'some-user'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
  })
})
