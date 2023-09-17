import {setupServer} from 'msw/node'
import {rest} from 'msw'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'

const server = setupServer()
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn'
  })
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('priority', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/priority')
  })

  it('labels the issue with the priority label', async () => {
    issueCommentEvent.comment.body = '/priority low'
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
        `${utils.api}/repos/Codertocat/Hello-World/contents/.github%2Flabels.yaml`,
        utils.mockResponse(200, labelFileContents)
      )
    )

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      labels: ['priority/low']
    })
  })

  it('handles multiple priority labels', async () => {
    issueCommentEvent.comment.body = '/priority low high'
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
        `${utils.api}/repos/Codertocat/Hello-World/contents/.github%2Flabels.yaml`,
        utils.mockResponse(200, labelFileContents)
      )
    )

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      labels: ['priority/low', 'priority/high']
    })
  })

  it('only adds priority labels for files in .github/labels.yaml', async () => {
    issueCommentEvent.comment.body = '/priority low mid high'
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
        `${utils.api}/repos/Codertocat/Hello-World/contents/.github%2Flabels.yaml`,
        utils.mockResponse(200, labelFileContents)
      )
    )

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      labels: ['priority/low', 'priority/high']
    })
  })
})
