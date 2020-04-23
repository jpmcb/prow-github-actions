import * as utils from '../testUtils'
import * as assign from '../../src/issueComment/assign'
import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'

it('ignores the comment if no command in comment', async () => {
    utils.setupActionsEnv('/assign')
  
    jest.spyOn(assign, 'assign');
    const commentContext = new utils.mockContext(issueCommentEvent)
  
    await handleIssueComment(commentContext)
    expect(assign.assign).toHaveBeenCalledTimes(0);
  })
