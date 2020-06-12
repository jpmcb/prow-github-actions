import nock from 'nock'

import * as utils from '../testUtils'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'

describe('/reopen', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/reopen')
  })

  it('reopens the issue with /reopen', async () => {
    issueCommentEvent.comment.body = '/reopen much better title'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(204)

    nock(utils.api)
      .patch('/repos/Codertocat/Hello-World/issues/1', body => {
        expect(body).toMatchObject({
          state: "open"
        })
        return true
      })
      .reply(200)
    
    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  describe('error', () => {
    xit('reply with error message cannot open', () => {
      // TODO
    })
  })
})
