import nock from 'nock'

import * as utils from '../testUtils'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'

describe('/lock', () => {
  beforeEach(() => {
    utils.setupActionsEnv('/lock')
  })

  it('locks the associated issue', async () => {
    issueCommentEvent.comment.body = '/lock'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(204)

    nock(utils.api)
      .put('/repos/Codertocat/Hello-World/issues/1/lock')
      .reply(200)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
  })

  it('locks the associated issue with given reason off-topic', async () => {
    issueCommentEvent.comment.body = '/lock off-topic'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(204)

    nock(utils.api)
      .put('/repos/Codertocat/Hello-World/issues/1/lock', body => {
        expect(body).toMatchObject({
          lock_reason: 'off-topic'
        })
        return true
      })
      .reply(200)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('locks the associated issue with given reason too-heated', async () => {
    issueCommentEvent.comment.body = '/lock too-heated'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(204)

    nock(utils.api)
      .put('/repos/Codertocat/Hello-World/issues/1/lock', body => {
        expect(body).toMatchObject({
          lock_reason: 'too heated'
        })
        return true
      })
      .reply(200)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  it('locks the associated issue with given reason spam', async () => {
    issueCommentEvent.comment.body = '/lock spam'

    nock(utils.api)
      .get('/repos/Codertocat/Hello-World/collaborators/Codertocat')
      .reply(204)

    nock(utils.api)
      .put('/repos/Codertocat/Hello-World/issues/1/lock', body => {
        expect(body).toMatchObject({
          lock_reason: 'spam'
        })
        return true
      })
      .reply(200)

    const commentContext = new utils.mockContext(issueCommentEvent)

    await handleIssueComment(commentContext)
    expect(nock.isDone()).toBe(true)
    expect.assertions(2)
  })

  describe('error', () => {
    xit('reply with error message cannot lock', () => {
      // TODO
    })
  })
})
