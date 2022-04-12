import nock from 'nock'

import {handleIssueComment} from '../../src/issueComment/handleIssueComment'
import { lgtm } from '../../src/labels/lgtm'

import * as utils from '../testUtils'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'
import issuePayload from '../fixtures/issues/issue.json'

jest.mock('fs')
import fs from 'fs'

nock.disableNetConnect()

describe('lgtm', () => {
  beforeEach(() => {
    nock.cleanAll()
    utils.setupActionsEnv('/lgtm')
  })
  afterEach(()=>{
    if (!nock.isDone()) {
      throw new Error(
        `Not all nock interceptors were used: ${JSON.stringify(
          nock.pendingMocks()
        )}`
      )
    }
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
  })

  it('adds label if commenter is collaborator', async () => {
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
  })

  it('throws if commenter is not reviewer in OWNERS', async () => {
    const owners = `
approvers:
- Codertocat
`
   
    fs.readFileSync = jest.fn();                
    (fs.readFileSync as jest.Mock).mockReturnValue(owners)
    fs.existsSync = jest.fn();
    (fs.existsSync as jest.Mock).mockReturnValue(true)

    issueCommentEvent.comment.body = '/lgtm'
    const commentContext = new utils.mockContext(issueCommentEvent)

    expect(() => lgtm(commentContext))
      .rejects.toThrowError('user not included in the reviewers role in the OWNERS file')
  })

  it('throws if commenter is not org member or collaborator', async () => {
    issueCommentEvent.comment.body = '/lgtm'
    const commentContext = new utils.mockContext(issueCommentEvent)

    expect(() => lgtm(commentContext))
      .rejects.toThrowError('user is not a org member or collaborator')
  })

  it('adds label if commenter is reviewer in OWNERS', async() => {
    issueCommentEvent.comment.body = '/lgtm'
    const commentContext = new utils.mockContext(issueCommentEvent)

    let parsedBody = undefined
    const scope = nock(utils.api)
      .post('/repos/Codertocat/Hello-World/issues/1/labels', body => {
        parsedBody = body
        return body
      })
      .reply(200)

    const owners = `
reviewers:
- Codertocat
`
   
    fs.readFileSync = jest.fn();                
    (fs.readFileSync as jest.Mock).mockReturnValue(owners)
    fs.existsSync = jest.fn();
    (fs.existsSync as jest.Mock).mockReturnValue(true)

    await handleIssueComment(commentContext)
    expect(parsedBody).toEqual({
      labels: ['lgtm']
    })
  })
})
