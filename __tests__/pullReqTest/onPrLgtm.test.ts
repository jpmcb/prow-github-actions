import { rest } from 'msw'
import { setupServer } from 'msw/node'

import { handlePullReq } from '../../src/pullReq/handlePullReq'
import issuePayload from '../fixtures/issues/issue.json'

import pullReqEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'
import * as utils from '../testUtils'

const server = setupServer()
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn',
  }),
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('onPrLgtm', () => {
  beforeEach(() => {
    utils.setupJobsEnv('lgtm')
  })

  it('removes the label lgtm', async () => {
    const prContext = new utils.MockContext(pullReqEvent)

    issuePayload.labels.push({
      id: 1999,
      node_id: 'MEOW111=',
      url: 'https://api.github.com/repos/octocat/Hello-World/labels/lgtm',
      name: 'lgtm',
      description: 'looks good to me',
      color: 'f29513',
      default: false,
    })

    server.use(
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1`,
        utils.mockResponse(200, issuePayload),
      ),
      rest.delete(
        `${utils.api}/repos/Codertocat/Hello-World/issues/1/labels/lgtm`,
        utils.mockResponse(200),
      ),
    )

    await expect(handlePullReq(prContext)).resolves.not.toThrow()
  })
})
