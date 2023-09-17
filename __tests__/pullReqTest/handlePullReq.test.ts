import * as core from '@actions/core'
import * as utils from '../testUtils'

import {handlePullReq} from '../../src/pullReq/handlePullReq'

import prCreatedEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'

it('ignores the jobs if not setup in environment', async () => {
  const spy = jest.spyOn(core, 'setFailed')

  utils.setupActionsEnv('/assign')

  const runContext = new utils.mockContext(prCreatedEvent)

  await handlePullReq(runContext)
  expect(spy).toHaveBeenCalled()
})
