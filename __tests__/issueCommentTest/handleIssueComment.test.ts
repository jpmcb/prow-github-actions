import nock from 'nock'

import {Context} from '@actions/github/lib/context'
import {WebhookPayload} from '@actions/github/lib/interfaces'

import {handleIssueComment} from '../../src/issueComment/handIssueComment'
import * as assign from '../../src/issueComment/assign'

import issueAssignedResp from '../fixtures/issues/issueAssignedResponse.json'
import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import issueCommentEventSelfAssign from '../fixtures/issues/issueCommentEvent-selfAssign.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('issue comments', () => {
  describe('/assign', () => {
    beforeEach(()=>{
      setupActionsEnv('/assign')
    })
    
    it('handles issue comment containing /assign', async () => {
      nock(api)
      .post('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['Codertocat']
        })
        return true
      })
      .reply(201, issueAssignedResp)
      
      const commentContext = new mockContext(issueCommentEventSelfAssign)

      await handleIssueComment(commentContext)
      expect.assertions(1)
    })
  })

  it('ignores the comment if no command in comment', async () => {
    setupActionsEnv('/assign')

    jest.spyOn(assign, 'assign');
    const commentContext = new mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(assign.assign).toHaveBeenCalledTimes(0);
  })
})

// Generate and create a fake context to use 
class mockContext extends Context {
  constructor(payload: WebhookPayload) {
    super()
    this.payload = payload
  }
}

const setupActionsEnv = (command: string = '') => {
  process.env = {}

  // set the neccessary env variables expected by the action:
  // https://help.github.com/en/github/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions#jobsjob_idstepswith
  process.env['INPUT_PROW-COMMAND'] = command
  process.env['INPUT_GITHUB-TOKEN'] = 'some-token'
}
