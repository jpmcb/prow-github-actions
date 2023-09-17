import {setupServer} from 'msw/node'
import {rest} from 'msw'

import * as utils from '../testUtils'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'

const server = setupServer()
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn'
  })
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('/lock', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/lock')
  })

  it('locks the associated issue', async () => {
    issueCommentEvent.comment.body = '/lock'

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(204)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.put(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/lock`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await expect(observeReq.called()).resolves.toBe('called')
  })

  it('locks the associated issue with given reason off-topic', async () => {
    issueCommentEvent.comment.body = '/lock off-topic'

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(204)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.put(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/lock`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      lock_reason: 'off-topic'
    })
  })

  it('locks the associated issue with given reason too-heated', async () => {
    issueCommentEvent.comment.body = '/lock too-heated'

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(204)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.put(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/lock`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      lock_reason: 'too heated'
    })
  })

  it('locks the associated issue with given reason spam', async () => {
    issueCommentEvent.comment.body = '/lock spam'

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(204)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.put(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/lock`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      lock_reason: 'spam'
    })
  })

  describe('error', () => {
    xit('reply with error message cannot lock', () => {
      // TODO
    })
  })
})
