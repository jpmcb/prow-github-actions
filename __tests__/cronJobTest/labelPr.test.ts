import {setupServer} from 'msw/node'
import {rest} from 'msw'

import {handleCronJobs} from '../../src/cronJobs/handleCronJob'
import * as utils from '../testUtils'

import pullReqOpenedEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'
import listPullReqs from '../fixtures/pullReq/pullReqListPulls.json'
import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'
import prListFiles from '../fixtures/pullReq/pullReqListFiles.json'
import prListTestFiles from '../fixtures/pullReq/pullReqListTestFiles.json'

const server = setupServer(
  // /repos/Codertocat/Hello-World/pulls?page={1,2}
  rest.get(
    `${utils.api}/repos/Codertocat/Hello-World/pulls`,
    (req, res, ctx) => {
      const page = req.url.searchParams.get('page')

      if (page == '1') {
        return res(ctx.status(200), ctx.json(listPullReqs))
      } else {
        return res(ctx.status(200), ctx.json([]))
      }
    }
  ),
  rest.get(
    `${utils.api}/repos/Codertocat/Hello-World/contents/.github%2Flabels.yaml`,
    utils.mockResponse(200, labelFileContents)
  )
)
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn'
  })
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('cronLabelPr', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/area')
  })

  it('labels the PR with the correct file labels based on globs', async () => {
    utils.setupJobsEnv('pr-labeler')

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.mockContext(pullReqOpenedEvent)

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/2/labels`,
        utils.mockResponse(200, null, observeReq)
      ),
      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/2/files`,
        utils.mockResponse(200, prListFiles)
      )
    )

    await expect(handleCronJobs(context)).resolves.not.toThrow()
    expect(observeReq.body()).toEqual({
      labels: ['source']
    })
  })

  it('labels the PR with the test label from glob', async () => {
    utils.setupJobsEnv('pr-labeler')

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.mockContext(pullReqOpenedEvent)

    const observeReq = new utils.observeRequest()
    server.use(
      rest.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/2/labels`,
        utils.mockResponse(200, null, observeReq)
      ),

      rest.get(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/2/files`,
        utils.mockResponse(200, prListTestFiles)
      )
    )

    await expect(handleCronJobs(context)).resolves.not.toThrow()
    expect(observeReq.body()).toEqual({
      labels: ['tests']
    })
  })
})
