import nock from 'nock'

import {handleCronJobs} from '../../src/cronJobs/handleCronJob'
import * as utils from '../testUtils'

import pullReqOpenedEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'
import listPullReqs from '../fixtures/pullReq/pullReqListPulls.json'
import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'
import prListFiles from '../fixtures/pullReq/pullReqListFiles.json'

nock.disableNetConnect()

describe('cronLabelPr', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/area')
  })

  it('labels the PR with the correct labels based on file globs', async () => {
    utils.setupJobsEnv('pr-labeler')

    // We can use any context here as "schedule" sends no webhook payload
    // Instead, we use it to gain the repo owner and url
    const context = new utils.mockContext(pullReqOpenedEvent)
    
    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls?page=1')
      .reply(200, listPullReqs)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls?page=2')
      .reply(200, [])

    let parsedBody = undefined
    const scope = nock(utils.api)
      .post('/repos/Codertocat/Hello-World/issues/2/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/contents/.github/labels.yaml')
      .reply(200, labelFileContents)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/pulls/2/files')
      .reply(200, prListFiles)

    await handleCronJobs(context)
    expect(parsedBody).toEqual({
      labels: ['source']
    })
    expect(scope.isDone()).toBe(true)
  })
})
