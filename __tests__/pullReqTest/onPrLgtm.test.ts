import nock from 'nock'

import {handlePullReq} from '../../src/pullReq/handlePullReq'
import * as utils from '../testUtils'
import * as core from '@actions/core'

import pullReqEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'
import issuePayload from '../fixtures/issues/issue.json'

nock.disableNetConnect()

describe('onPrLgtm', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupJobsEnv('lgtm')
  })

  it('removes the label lgtm', async () => {
    const prContext = new utils.mockContext(pullReqEvent)

    issuePayload.labels.push({
      "id": 1999,
      "node_id": "MEOW111=",
      "url": "https://api.github.com/repos/octocat/Hello-World/labels/lgtm",
      "name": "lgtm",
      "description": "looks good to me",
      "color": "f29513",
      "default": false
    })

    nock(utils.api)
      .delete('/repos/Codertocat/Hello-World/issues/1/labels/lgtm')
      .reply(200)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1')
      .reply(200, issuePayload)

    await handlePullReq(prContext)
    expect(nock.isDone()).toBe(true)
  })
})
