import {setupServer} from 'msw/node'
import {rest} from 'msw'

import * as core from '@actions/core'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'
import malformedFileContents from '../fixtures/labels/labelFileMalformedResponse.json'

const server = setupServer()
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn'
  })
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('utils labeling', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/area')
  })

  it('can read from both .yaml and .yml label files', async () => {
    issueCommentEvent.comment.body = '/area important'
    const commentContext = new utils.mockContext(issueCommentEvent)

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/labels`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/contents/.github%2Flabels.yml`,
        utils.mockResponse(200, labelFileContents)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/contents/.github%2Flabels.yaml`,
        utils.mockResponse(404)
      )
    )

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      labels: ['area/important']
    })
  })

  it('can error correctly on malformed label.yaml', async () => {
    const spy = jest.spyOn(core, 'setFailed')

    issueCommentEvent.comment.body = '/area important'
    const commentContext = new utils.mockContext(issueCommentEvent)

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/contents/.github%2Flabels.yml`,
        utils.mockResponse(200, malformedFileContents)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/contents/.github%2Flabels.yaml`,
        utils.mockResponse(404)
      )
    )

    await handleIssueComment(commentContext)

    expect(spy).toHaveBeenCalled()
  })
})
