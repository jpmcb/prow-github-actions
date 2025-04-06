import { http } from 'msw'
import { setupServer } from 'msw/node'

import { handleCronJobs } from '../../src/cronJobs/handleCronJob'
import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'

import prListFiles from '../fixtures/pullReq/pullReqListFiles.json'
import listPullReqs from '../fixtures/pullReq/pullReqListPulls.json'
import prListTestFiles from '../fixtures/pullReq/pullReqListTestFiles.json'
import pullReqOpenedEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'
import * as utils from '../testUtils'

const server = setupServer(
  // /repos/Codertocat/Hello-World/pulls?page={1,2}
  http.get(
    `${utils.api}/repos/Codertocat/Hello-World/pulls`,
    ({ request }) => {
      const url = new URL(request.url)
      const page = url.searchParams.get('page')

      if (page === '1') {
        return new Response(JSON.stringify(listPullReqs), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }
      else {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }
    },
  ),
  http.get(
    `${utils.api}/repos/Codertocat/Hello-World/contents/.github%2Flabels.yaml`,
    utils.mockResponse(200, labelFileContents),
  ),
)
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn',
  }),
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
    const context = new utils.MockContext(pullReqOpenedEvent)

    const observeReq = new utils.ObserveRequest()
    server.use(
      http.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/2/labels`,
        utils.mockResponse(200, null, observeReq),
      ),
      http.get(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/2/files`,
        utils.mockResponse(200, prListFiles),
      ),
    )

    await expect(handleCronJobs(context)).resolves.not.toThrow()
    expect(await observeReq.body()).toEqual({
      labels: ['source'],
    })
  })

  it('labels the PR with the test label from glob', async () => {
    utils.setupJobsEnv('pr-labeler')

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.MockContext(pullReqOpenedEvent)

    const observeReq = new utils.ObserveRequest()
    server.use(
      http.post(
        `${utils.api}/repos/Codertocat/Hello-World/issues/2/labels`,
        utils.mockResponse(200, null, observeReq),
      ),

      http.get(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/2/files`,
        utils.mockResponse(200, prListTestFiles),
      ),
    )

    await expect(handleCronJobs(context)).resolves.not.toThrow()
    expect(await observeReq.body()).toEqual({
      labels: ['tests'],
    })
  })
})
