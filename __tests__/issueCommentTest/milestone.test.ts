import {setupServer} from 'msw/node'
import {rest} from 'msw'

import * as utils from '../testUtils'
import * as core from '@actions/core'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import repoMilestones from '../fixtures/milestones/repoListMilestones.json'

const server = setupServer()
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn'
  })
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('/milestone', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/milestone')
  })

  it('adds issue to milestone that already exists', async () => {
    issueCommentEvent.comment.body = '/milestone some milestone'

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/milestones`,
        utils.mockResponse(200, repoMilestones)
      )
    )

    const observeReq = new utils.observeRequest()
    server.use(
      rest.patch(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(204)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    await observeReq.called()
    expect(observeReq.body()).toMatchObject({
      milestone: 1
    })
  })

  it('fails when commenter is not a collaborator', async () => {
    issueCommentEvent.comment.body = '/milestone some milestone'

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/milestones`,
        utils.mockResponse(200, repoMilestones)
      )
    )

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(404)
      )
    )

    const commentContext = new utils.mockContext(issueCommentEvent)

    const spy = jest.spyOn(core, 'setFailed')
    await handleIssueComment(commentContext)
    expect(spy).toHaveBeenCalled()
  })

  describe('error', () => {
    xit('reply with error message cannot milestone', () => {
      // TODO
    })
  })
})
