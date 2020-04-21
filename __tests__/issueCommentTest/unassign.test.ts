import nock from 'nock'

import * as utils from '../utils'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import issueUnassignedResp from '../fixtures/issues/issueUnassignedResponse.json'
import issueCommentEventSelfUnassign from '../fixtures/issues/issueCommentEvent-selfUnassign.json'

describe('/unassign', () => {
    beforeEach(()=>{
      utils.setupActionsEnv('/unassign')
    })
    
    it('unassigns the user who commented', async () => {
      nock(utils.api)
      .delete('/repos/Codertocat/Hello-World/issues/1/assignees', body => {
        expect(body).toMatchObject({
          assignees: ['Codertocat']
        })
        return true
      })
      .reply(201, issueUnassignedResp)
      
      const commentContext = new utils.mockContext(issueCommentEventSelfUnassign)

      await handleIssueComment(commentContext)
      expect.assertions(1)
    })
  })