import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('kind', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/kind')
  })

  it('labels the issue with the kind', async () => {
    issueCommentEvent.comment.body = '/kind cleanup'
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
      labels: ['kind/cleanup']
    })
    expect(scope.isDone()).toBe(true)
  })

  it('handles multiple labels', async () => {
    issueCommentEvent.comment.body = '/kind cleanup failing-test'
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
      labels: ['kind/cleanup', 'kind/failing-test']
    })
    expect(scope.isDone()).toBe(true)
  })

  it('only adds labels for files in .github/labels.yaml', async () => {
    issueCommentEvent.comment.body = '/kind cleanup bad failing-test'
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
      labels: ['kind/cleanup', 'kind/failing-test']
    })
    expect(scope.isDone()).toBe(true)
  })
})