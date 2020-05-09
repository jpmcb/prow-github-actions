import * as utils from '../testUtils'
import * as prLabeler from '../../src/pullReq/prLabeler'
import {handlePullReq} from '../../src/pullReq/handlePullReq'

import prCreatedEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'

it('ignores the auto-run if not setup in environment', async () => {
  utils.setupActionsEnv('/assign')

  jest.spyOn(prLabeler, 'labelPr')
  const runContext = new utils.mockContext(prCreatedEvent)

  await handlePullReq(runContext)
  expect(prLabeler.labelPr).toHaveBeenCalledTimes(0)
})
