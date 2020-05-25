import nock from 'nock'

import * as utils from '../testUtils'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import workflowsList from '../fixtures/workflows/listWorkflows.json'

describe('/rerun', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/rerun')
  })

  it('reruns the workflow', async () => {
    issueCommentEvent.comment.body = '/rerun some workflow'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/actions/workflows')
      .reply(200, workflowsList)

    nock(utils.api)
      .post('/repos/Codertocat/Hello-World/actions/runs/1/rerun')
      .reply(201)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
  })

  describe('error', () => {
    xit('reply with error message cannot rerun', () => {
      // TODO
    })
  })
})
