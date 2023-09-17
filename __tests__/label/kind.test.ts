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

describe('kind', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/kind')
  })

  it('labels the issue with the kind label', async () => {
    issueCommentEvent.comment.body = '/kind cleanup'
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
      labels: ['kind/cleanup']
    })
  })

  it('handles multiple kind labels', async () => {
    issueCommentEvent.comment.body = '/kind cleanup failing-test'
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
      labels: ['kind/cleanup', 'kind/failing-test']
    })
  })

  it('only adds kind labels for files in .github/labels.yaml', async () => {
    issueCommentEvent.comment.body = '/kind cleanup bad failing-test'
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
      labels: ['kind/cleanup', 'kind/failing-test']
    })
  })
})
