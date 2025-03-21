import {setupServer} from 'msw/node'
import {rest} from 'msw'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import issuePayload from '../fixtures/issues/issue.json'

const server = setupServer()
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn'
  })
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('hold', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/hold')
  })

  it('labels the issue with the hold label', async () => {
    issueCommentEvent.comment.body = '/hold'
    const commentContext = new utils.mockContext(issueCommentEvent)

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/labels`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      labels: ['hold']
    })
  })

  it('removes the hold label with /hold cancel', async () => {
    issueCommentEvent.comment.body = '/hold cancel'
    const commentContext = new utils.mockContext(issueCommentEvent)

    issuePayload.labels.push({
      id: 1,
      node_id: '123',
      url: 'https://api.github.com/repos/octocat/Hello-World/labels/lgtm',
      name: 'hold',
      description: 'looks good to me',
      color: 'f29513',
      default: true
    })

    const observeReqDelete = new utils.observeRequest()
    const observeReqGet = new utils.observeRequest()
    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/labels/hold`,
        utils.mockResponse(200, null, observeReqDelete)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1`,
        utils.mockResponse(200, issuePayload, observeReqGet)
      )
    )

    await handleIssueComment(commentContext)
    await expect(observeReqDelete.called()).resolves.toBe('called')
    await expect(observeReqGet.called()).resolves.toBe('called')
  })
})
