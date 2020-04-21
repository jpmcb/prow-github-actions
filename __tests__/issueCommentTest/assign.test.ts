import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as assign from '../../src/issueComment/assign'
import * as utils from '../utils'

import issueAssignedResp from '../fixtures/issues/issueAssignedResponse.json'
import issueCommentEventSelfAssign from '../fixtures/issues/issueCommentEvent-selfAssign.json'

nock.disableNetConnect()

const api = 'https://api.github.com'

describe('/assign', () => {
  beforeEach(()=>{
    utils.setupActionsEnv('/assign')
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
    
    const commentContext = new utils.mockContext(issueCommentEventSelfAssign)

    await handleIssueComment(commentContext)
    expect.assertions(1)
  })
})
