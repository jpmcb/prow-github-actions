import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'
import issuePayload from '../fixtures/issues/issue.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('lgtm', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/lgtm')
  })

  it('labels the issue with the lgtm label', async () => {
    issueCommentEvent.comment.body = '/lgtm'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    const scope = nock(api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)
    
    nock(api)
      .get('/repos/Codertocat/Hello-World/contents/.github/labels.yaml')
      .reply(200, labelFileContents)

    await handleIssueComment(commentContext)
    expect(parsedBody).toEqual({
      labels: ['lgtm']
    })
    expect(scope.isDone()).toBe(true)
  })

  it('removes the lgtm label with /lgtm cancel', async () => {
    issueCommentEvent.comment.body = '/lgtm cancel'
    const commentContext = new utils.mockContext(issueCommentEvent)

    issuePayload.labels.push({
      "id": 1,
      "node_id": "123",
      "url": "https://api.github.com/repos/octocat/Hello-World/labels/lgtm",
      "name": "lgtm",
      "description": "looks good to me",
      "color": "f29513",
      "default": true
    })

    nock(api)
      .delete('/repos/Codertocat/Hello-World/issues/1/labels/lgtm')
      .reply(200)
    
    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1')
      .reply(200, issuePayload)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
  })
})