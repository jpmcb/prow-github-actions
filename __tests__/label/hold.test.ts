import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import issuePayload from '../fixtures/issues/issue.json'

nock.disableNetConnect()

describe('hold', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/hold')
  })

  it('labels the issue with the hold label', async () => {
    issueCommentEvent.comment.body = '/hold'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    nock(utils.api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    await handleIssueComment(commentContext)
    expect(parsedBody).toEqual({
      labels: ['hold']
    })
    expect(nock.isDone()).toBe(true)
  })

  it('removes the hold label with /hold cancel', async () => {
    issueCommentEvent.comment.body = '/hold cancel'
    const commentContext = new utils.mockContext(issueCommentEvent)

    issuePayload.labels.push({
      "id": 1,
      "node_id": "123",
      "url": "https://api.github.com/repos/octocat/Hello-World/labels/lgtm",
      "name": "hold",
      "description": "looks good to me",
      "color": "f29513",
      "default": true
    })

    nock(utils.api)
      .delete('/repos/Codertocat/Hello-World/issues/1/labels/hold')
      .reply(200)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1')
      .reply(200, issuePayload)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
  })
})
