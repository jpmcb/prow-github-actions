import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import pullReqListReviews from '../fixtures/pullReq/pullReqListReviews.json'
import issueCommentEventAssign from '../fixtures/issues/assign/issueCommentEventAssign.json'

nock.disableNetConnect()

describe('/approve', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/approve')
  })

  it('approves the pr with /approve command', async () => {
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
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('removes approval with the /approve cancel command', async () => {
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
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })
})
