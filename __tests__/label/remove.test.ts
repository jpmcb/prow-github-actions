import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import issuePayload from '../fixtures/issues/issue.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('remove', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/remove')
  })

  it('removes the label', async () => {
    issueCommentEvent.comment.body = '/remove some-label'
    const commentContext = new utils.mockContext(issueCommentEvent)

    nock(api)
      .delete('/repos/Codertocat/Hello-World/issues/1/labels/some-label')
      .reply(200)
    
    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1')
      .reply(200, issuePayload)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
  })

  it('removes multiple the labels', async () => {
    issueCommentEvent.comment.body = '/remove some-label some-other-label'
    const commentContext = new utils.mockContext(issueCommentEvent)

    nock(api)
      .delete('/repos/Codertocat/Hello-World/issues/1/labels/some-label')
      .reply(200)

    nock(api)
      .delete('/repos/Codertocat/Hello-World/issues/1/labels/some-other-label')
      .reply(200)
    
    nock(api)
      .get('/repos/Codertocat/Hello-World/issues/1')
      .reply(200, issuePayload)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
  })
})