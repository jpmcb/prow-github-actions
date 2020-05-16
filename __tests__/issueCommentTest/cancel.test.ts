import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import pullReqListReviews from '../fixtures/pullReq/pullReqListReviews.json'
import issueCommentEventAssign from '../fixtures/issues/assign/issueCommentEventAssign.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('/approve', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/cancel')
  })

  it('removes approval with the /approve cancel command', async () => {
    let parsedBody = undefined
    const scope = nock(api)
      .get('/repos/Codertocat/Hello-World/pulls/1/reviews')
      .reply(200, pullReqListReviews)

    nock(api)
      .put(
        '/repos/Codertocat/Hello-World/pulls/1/reviews/80/dismissals',
        body => {
          expect(body).toMatchObject({
            message: 'Canceled by prow-github-actions bot'
          })
          return true
        }
      )
      .reply(200)

    issueCommentEventAssign.comment.body = '/cancel'
    issueCommentEventAssign.comment.user.login = 'some-user'
    const commentContext = new utils.mockContext(issueCommentEventAssign)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })
})
