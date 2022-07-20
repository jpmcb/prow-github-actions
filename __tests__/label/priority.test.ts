import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'

nock.disableNetConnect()

describe('priority', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/priority')
  })

  it('labels the issue with the priority label', async () => {
    issueCommentEvent.comment.body = '/priority low'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    const scope = nock(utils.api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/contents/.github/labels.yaml')
      .reply(200, labelFileContents)

    await handleIssueComment(commentContext)
    expect(parsedBody).toEqual({
      labels: ['priority/low']
    })
    expect(scope.isDone()).toBe(true)
  })

  it('handles multiple priority labels', async () => {
    issueCommentEvent.comment.body = '/priority low high'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    const scope = nock(utils.api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/contents/.github/labels.yaml')
      .reply(200, labelFileContents)

    await handleIssueComment(commentContext)
    expect(parsedBody).toEqual({
      labels: ['priority/low', 'priority/high']
    })
    expect(scope.isDone()).toBe(true)
  })

  it('only adds priority labels for files in .github/labels.yaml', async () => {
    issueCommentEvent.comment.body = '/priority low mid high'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    const scope = nock(utils.api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/contents/.github/labels.yaml')
      .reply(200, labelFileContents)

    await handleIssueComment(commentContext)
    expect(parsedBody).toEqual({
      labels: ['priority/low', 'priority/high']
    })
    expect(scope.isDone()).toBe(true)
  })
})
