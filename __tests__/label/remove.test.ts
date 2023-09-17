import {setupServer} from 'msw/node'
import {rest} from 'msw'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as utils from '../testUtils'
import * as core from '@actions/core'

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

describe('remove', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/remove')
  })

  it('removes the specified label', async () => {
    issueCommentEvent.comment.body = '/remove some-label'
    const commentContext = new utils.mockContext(issueCommentEvent)

    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/labels/some-label`,
        utils.mockResponse(200)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1`,
        utils.mockResponse(200, issuePayload)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(204)
      )
    )

    await handleIssueComment(commentContext)
  })

  it('removes multiple labels', async () => {
    issueCommentEvent.comment.body = '/remove some-label some-other-label'
    const commentContext = new utils.mockContext(issueCommentEvent)

    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/labels/some-label`,
        utils.mockResponse(200)
      ),
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/labels/some-other-label`,
        utils.mockResponse(200)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1`,
        utils.mockResponse(200, issuePayload)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(204)
      )
    )

    await handleIssueComment(commentContext)
  })

  it('fails if commenter is not collaborator', async () => {
    issueCommentEvent.comment.body = '/remove some-label'
    const commentContext = new utils.mockContext(issueCommentEvent)

    server.use(
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/labels/some-label`,
        utils.mockResponse(200)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1`,
        utils.mockResponse(200, issuePayload)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/collaborators/Codertocat`,
        utils.mockResponse(404)
      )
    )

    const spy = jest.spyOn(core, 'setFailed')
    await handleIssueComment(commentContext)
    expect(spy).toHaveBeenCalled()
  })
})
