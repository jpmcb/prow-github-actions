import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import * as core from '@actions/core'
import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import labelFileContents from '../fixtures/labels/labelFileContentsResp.json'
import issuePayload from '../fixtures/issues/issue.json'

nock.disableNetConnect()

describe('lgtm', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/lgtm')
  })

  it('labels the issue with the lgtm label', async () => {
    issueCommentEvent.comment.body = '/lgtm'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    const scope = nock(utils.api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    nock(utils.api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    await handleIssueComment(commentContext)
    expect(parsedBody).toEqual({
      labels: ['lgtm']
    })
    expect(nock.isDone()).toBe(true)
  })

  it('removes the lgtm label with /lgtm cancel', async () => {
    issueCommentEvent.comment.body = '/lgtm cancel'
    const commentContext = new utils.mockContext(issueCommentEvent)

    issuePayload.labels.push({
      id: 1,
      node_id: '123',
      url: 'https://api.github.com/repos/octocat/Hello-World/labels/lgtm',
      name: 'lgtm',
      description: 'looks good to me',
      color: 'f29513',
      default: true
    })

    nock(utils.api)
      .delete('/repos/Codertocat/Hello-World/issues/1/labels/lgtm')
      .reply(200)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/issues/1')
      .reply(200, issuePayload)

    nock(utils.api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(204)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
  })

  it('adds label if commentor is collaborator', async () => {
    issueCommentEvent.comment.body = '/lgtm'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    const scope = nock(utils.api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    nock(utils.api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(204)

    await handleIssueComment(commentContext)
    expect(parsedBody).toEqual({
      labels: ['lgtm']
    })
    expect(nock.isDone()).toBe(true)
  })

  it('throws if commentor is not org member or collaborator', async () => {
    issueCommentEvent.comment.body = '/lgtm'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    const scope = nock(utils.api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    nock(utils.api)
      .get('/orgs/Codertocat/members/Codertocat')
      .reply(404)

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(404)

    const spy = jest.spyOn(core, 'setFailed')
    await handleIssueComment(commentContext)
    expect(spy).toHaveBeenCalled()
  })
})
