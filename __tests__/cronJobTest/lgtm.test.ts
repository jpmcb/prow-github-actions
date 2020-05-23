import nock from 'nock'

import {handleCronJobs} from '../../src/cronJobs/handleCronJob'
import * as utils from '../testUtils'

import pullReqOpenedEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'
import listPullReqs from '../fixtures/pullReq/pullReqListPulls.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('cronLgtm', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('labels the PR with the correct file labels', async () => {
    utils.setupJobsEnv('lgtm')

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.mockContext(pullReqOpenedEvent)

    listPullReqs[0].labels[0].name = 'lgtm'

    nock(api)
      .get('/repos/Codertocat/Hello-World/pulls?state=open&page=1')
      .reply(200, listPullReqs)

    nock(api)
      .get('/repos/Codertocat/Hello-World/pulls?state=open&page=2')
      .reply(200, [])

    nock(api)
      .put('/repos/Codertocat/Hello-World/pulls/2/merge')
      .reply(200)

    await handleCronJobs(context)
    expect(nock.isDone()).toBe(true)
  })
})
