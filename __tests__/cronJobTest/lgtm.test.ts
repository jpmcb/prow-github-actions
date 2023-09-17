import {setupServer} from 'msw/node'
import {rest} from 'msw'

import {handleCronJobs} from '../../src/cronJobs/handleCronJob'
import * as utils from '../testUtils'

import pullReqOpenedEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'
import listPullReqs from '../fixtures/pullReq/pullReqListPulls.json'

const server = setupServer(
  // /repos/Codertocat/Hello-World/pulls?state=open&page={1,2}
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
  )
)
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'warn'
  })
)
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('cronLgtm', () => {
  it('merges the PR if the lgtm label is present', async () => {
    utils.setupJobsEnv('lgtm')

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.mockContext(pullReqOpenedEvent)

    listPullReqs[0].labels[0].name = 'lgtm'

    const observeReq = new utils.observeRequest()
    server.use(
      rest.put(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/2/merge`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    await expect(handleCronJobs(context)).resolves.not.toThrow()
    expect(observeReq.body()).toEqual({
      merge_method: 'merge'
    })
  })

  it('merges the PR with squash configured', async () => {
    utils.setupJobsEnv('lgtm')
    process.env['INPUT_MERGE-METHOD'] = 'squash'

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.mockContext(pullReqOpenedEvent)

    listPullReqs[0].labels[0].name = 'lgtm'

    const observeReq = new utils.observeRequest()
    server.use(
      rest.put(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/2/merge`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    await expect(handleCronJobs(context)).resolves.not.toThrow()
    expect(observeReq.body()).toEqual({
      merge_method: 'squash'
    })
  })

  it('merges the PR with rebase configured', async () => {
    utils.setupJobsEnv('lgtm')
    process.env['INPUT_MERGE-METHOD'] = 'rebase'

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.mockContext(pullReqOpenedEvent)

    listPullReqs[0].labels[0].name = 'lgtm'

    const observeReq = new utils.observeRequest()
    server.use(
      rest.put(
        `${utils.api}/repos/Codertocat/Hello-World/pulls/2/merge`,
        utils.mockResponse(200, null, observeReq)
      )
    )

    await expect(handleCronJobs(context)).resolves.not.toThrow()
    expect(observeReq.body()).toEqual({
      merge_method: 'rebase'
    })
  })

  it('wont merge the PR if the hold label is present', async () => {
    utils.setupJobsEnv('lgtm')

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.mockContext(pullReqOpenedEvent)

    listPullReqs[0].labels[0].name = 'lgtm'
    listPullReqs[0].labels.push({
      id: 1,
      node_id: '123',
      url: 'https://api.github.com/repos/octocat/Hello-World/labels/hold',
      name: 'hold',
      description: 'looks good to me',
      color: 'f29513',
      default: true
    })

    await expect(handleCronJobs(context)).resolves.not.toThrow()
  })
})
