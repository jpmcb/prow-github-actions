import nock from 'nock'

import * as utils from '../testUtils'
import * as core from '@actions/core'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import repoMilestones from '../fixtures/milestones/repoListMilestones.json'

describe('/milestone', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/milestone')
  })

  it('adds issue to milestone that already exists', async () => {
    issueCommentEvent.comment.body = '/milestone some milestone'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/milestones')
      .reply(200, repoMilestones)

      nock(utils.api)
      .patch('/repos/Codertocat/Hello-World/issues/1', body => {
        expect(body).toMatchObject({
          milestone: 1
        })
        return true
      })
      .reply(200)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(204)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
  })

  it('fails when commenter is not a collaborator', async () => {
    issueCommentEvent.comment.body = '/milestone some milestone'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/milestones')
      .reply(200, repoMilestones)

      nock(utils.api)
      .patch('/repos/Codertocat/Hello-World/issues/1', body => {
        expect(body).toMatchObject({
          milestone: 1
        })
        return true
      })
      .reply(200)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    const commentContext = new utils.mockContext(issueCommentEvent)

    const spy = jest.spyOn(core, 'setFailed')
    await handleIssueComment(commentContext)
    expect(spy).toHaveBeenCalled()
  })

  describe('error', () => {
    xit('reply with error message cannot milestone', () => {
      // TODO
    })
  })
})
