import nock from 'nock'

import * as utils from '../testUtils'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'

describe('/retitle', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/retitle')
  })

  it('handles renaming title when user is collaborator', async () => {
    issueCommentEvent.comment.body = '/retitle much better title'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(204)

    nock(utils.api)
      .patch('/repos/Codertocat/Hello-World/issues/1', body => {
        expect(body).toMatchObject({
          title: "much better title"
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
    xit('reply with error message cannot retitle', () => {
      // TODO
    })
  })
})
