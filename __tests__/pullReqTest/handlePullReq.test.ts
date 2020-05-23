import * as utils from '../testUtils'
import {handlePullReq} from '../../src/pullReq/handlePullReq'

import prCreatedEvent from '../fixtures/pullReq/pullReqOpenedEvent.json'

it('ignores the jobs if not setup in environment', async () => {
  utils.setupActionsEnv('/assign')

  const runContext = new utils.mockContext(prCreatedEvent)

  await expect(handlePullReq(runContext)).rejects.toThrow()
})
