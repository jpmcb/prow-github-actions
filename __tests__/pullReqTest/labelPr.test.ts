import nock from 'nock'

import {handlePullReq} from '../../src/pullReq/handlePullReq'
import * as utils from '../testUtils'

import prOpenedEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'
import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'
import prListFiles from '../fixtures/pullReq/pullReqListFiles.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('labelPr', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/area')
  })

  it('labels the PR with the correct file labels', async () => {
    utils.setupAutoRunEnv('pr-labeler')
    const prContext = new utils.mockContext(prOpenedEvent)

    let parsedBody = undefined
    const scope = nock(api)
      .post('/repos/Codertocat/Hello-World/issues/2/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)
    
    nock(api)
      .get('/repos/Codertocat/Hello-World/contents/.github/labels.yaml')
      .reply(200, labelFileContents)

    nock(api)
      .get('/repos/Codertocat/Hello-World/pulls/2/files')
      .reply(200, prListFiles)

    await handlePullReq(prContext)
    expect(parsedBody).toEqual({
      labels: ['source']
    })
    expect(scope.isDone()).toBe(true)
  })
})