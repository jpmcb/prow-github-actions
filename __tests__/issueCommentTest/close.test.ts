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

describe('/close', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/close')
  })

  it('closes the issue with /close', async () => {
    issueCommentEvent.comment.body = '/close much better title'

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(204)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.patch(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      state: 'closed'
    })
  })

  describe('error', () => {
    xit('reply with error message cannot close', () => {
      // TODO
    })
  })
})
