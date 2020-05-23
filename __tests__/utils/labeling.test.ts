import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'
import malformedFileContents from '../fixtures/labels/labelFileMalformedResponse.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('utils labeling', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/area')
  })

  it('can read from both .yaml and .yml label files', async () => {
    issueCommentEvent.comment.body = '/area important'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    const scope = nock(api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    nock(api)
      .get('/repos/Codertocat/Hello-World/contents/.github/labels.yml')
      .reply(200, labelFileContents)

    nock(api)
      .get('/repos/Codertocat/Hello-World/contents/.github/labels.yaml')
      .reply(404)

    await handleIssueComment(commentContext)
    expect(parsedBody).toEqual({
      labels: ['area/important']
    })
    expect(scope.isDone()).toBe(true)
  })

  it('can error correctly on malformed label.yaml', async () => {
    issueCommentEvent.comment.body = '/area important'
    const commentContext = new utils.mockContext(issueCommentEvent)
    
    nock(api)
      .get('/repos/Codertocat/Hello-World/contents/.github/labels.yml')
      .reply(200, malformedFileContents)

    nock(api)
      .get('/repos/Codertocat/Hello-World/contents/.github/labels.yaml')
      .reply(404)

    await expect(handleIssueComment(commentContext)).rejects.toThrow()
  })
})
