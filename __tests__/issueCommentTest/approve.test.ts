import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueCommentEventAssign from '../fixtures/issues/assign/issueCommentEventAssign.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('/approve', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/approve')
  })

  it('approves the pr with /approve command', async () => {
    nock(api)
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

  xit('removes approval with the /approve cancel command', async () => {
    // TODO - implement
  })
})
