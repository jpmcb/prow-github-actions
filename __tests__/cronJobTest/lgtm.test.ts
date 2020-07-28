import nock from 'nock'

import {handleCronJobs} from '../../src/cronJobs/handleCronJob'
import * as utils from '../testUtils'

import pullReqOpenedEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'
import listPullReqs from '../fixtures/pullReq/pullReqListPulls.json'

nock.disableNetConnect()

describe('cronLgtm', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('merges the PR if the lgtm label is present', async () => {
    utils.setupJobsEnv('lgtm')

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.mockContext(pullReqOpenedEvent)

    listPullReqs[0].labels[0].name = 'lgtm'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls?state=open&page=1')
      .reply(200, listPullReqs)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls?state=open&page=2')
      .reply(200, [])

    let parsedBody = undefined
    nock(utils.api)
      .put('/repos/Codertocat/Hello-World/pulls/2/merge', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    await handleCronJobs(context)
    expect(parsedBody).toEqual({
      merge_method: 'merge'
    })
    expect(nock.isDone()).toBe(true)
  })

  it('merges the PR with squash configured', async () => {
    utils.setupJobsEnv('lgtm')
    process.env['INPUT_MERGE-METHOD'] = 'squash'

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.mockContext(pullReqOpenedEvent)

    listPullReqs[0].labels[0].name = 'lgtm'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls?state=open&page=1')
      .reply(200, listPullReqs)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls?state=open&page=2')
      .reply(200, [])

    let parsedBody = undefined
    nock(utils.api)
      .put('/repos/Codertocat/Hello-World/pulls/2/merge', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    await handleCronJobs(context)
    expect(parsedBody).toEqual({
      merge_method: 'squash'
    })
    expect(nock.isDone()).toBe(true)
  })

  it('merges the PR with rebase configured', async () => {
    utils.setupJobsEnv('lgtm')
    process.env['INPUT_MERGE-METHOD'] = 'rebase'

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.mockContext(pullReqOpenedEvent)

    listPullReqs[0].labels[0].name = 'lgtm'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls?state=open&page=1')
      .reply(200, listPullReqs)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls?state=open&page=2')
      .reply(200, [])

    let parsedBody = undefined
    nock(utils.api)
      .put('/repos/Codertocat/Hello-World/pulls/2/merge', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    await handleCronJobs(context)
    expect(parsedBody).toEqual({
      merge_method: 'rebase'
    })
    expect(nock.isDone()).toBe(true)
  })

  it('wont merge the PR if the hold label is present', async () => {
    utils.setupJobsEnv('lgtm')

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.mockContext(pullReqOpenedEvent)

    listPullReqs[0].labels[0].name = 'lgtm'
    listPullReqs[0].labels.push({
      "id": 1,
      "node_id": "123",
      "url": "https://api.github.com/repos/octocat/Hello-World/labels/hold",
      "name": "hold",
      "description": "looks good to me",
      "color": "f29513",
      "default": true
    })

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls?state=open&page=1')
      .reply(200, listPullReqs)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls?state=open&page=2')
      .reply(200, [])

    await handleCronJobs(context)
    expect(nock.isDone()).toBe(true)
  })
})
