import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('area', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/area')
  })

  it('labels the issue with the label', async () => {
    issueCommentEvent.comment.body = '/area meow'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    const scope = nock(api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)
    
    nock(api)
      .get('/repos/Codertocat/Hello-World/contents/.github/LABELS')
      .reply(200, labelFileContents)

    await handleIssueComment(commentContext)
    expect(parsedBody).toEqual({
      labels: ['area/meow']
    })
    expect(scope.isDone()).toBe(true)
  })

  it('handles multiple labels', async () => {
    issueCommentEvent.comment.body = '/area meow important'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    const scope = nock(api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    nock(api)
      .get('/repos/Codertocat/Hello-World/contents/.github/LABELS')
      .reply(200, labelFileContents)

    await handleIssueComment(commentContext)
    expect(parsedBody).toEqual({
      labels: ['area/meow', 'area/important']
    })
    expect(scope.isDone()).toBe(true)
  })

  it('only adds labels for files in .github/labels.yaml', async () => {
    issueCommentEvent.comment.body = '/area meow bad important'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    const scope = nock(api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    nock(api)
      .get('/repos/Codertocat/Hello-World/contents/.github/LABELS')
      .reply(200, labelFileContents)

    await handleIssueComment(commentContext)
    expect(parsedBody).toEqual({
      labels: ['area/meow', 'area/important']
    })
    expect(scope.isDone()).toBe(true)
  })
})