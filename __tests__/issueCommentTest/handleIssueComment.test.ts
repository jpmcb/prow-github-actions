import * as utils from '../testUtils'
import * as assign from '../../src/issueComment/assign'
import * as unassign from '../../src/issueComment/unassign'
import {handleIssueComment} from '../../src/issueComment/handleIssueComment'

import issueCommentEvent from '../fixtures/issues/issueCommentEvent.json'

it('ignores the comment if no command in comment', async () => {
  utils.setupActionsEnv('/assign')

  jest.spyOn(assign, 'assign')
  const commentContext = new utils.mockContext(issueCommentEvent)

  await handleIssueComment(commentContext)
  expect(assign.assign).toHaveBeenCalledTimes(0)
})

it('can handle multiple commands in prow-commands config', async () => {
  utils.setupActionsEnv('/assign /unassign')

  jest.spyOn(assign, 'assign').mockImplementation(() => Promise.resolve())
  jest.spyOn(unassign, 'unassign').mockImplementation(() => Promise.resolve())

  issueCommentEvent.comment.body = '/assign'
  const assignContext = new utils.mockContext(issueCommentEvent)

  await handleIssueComment(assignContext)
  expect(assign.assign).toHaveBeenCalledTimes(1)

  issueCommentEvent.comment.body = '/unassign'
  const unassignContext = new utils.mockContext(issueCommentEvent)

  await handleIssueComment(unassignContext)
  expect(unassign.unassign).toHaveBeenCalledTimes(1)
})

it('can handle comments with multiple commands', async () => {
  utils.setupActionsEnv('/assign /unassign')

  jest.spyOn(assign, 'assign').mockImplementation(() => Promise.resolve())
  jest.spyOn(unassign, 'unassign').mockImplementation(() => Promise.resolve())

  issueCommentEvent.comment.body =
    '/assign @some-user @other-user\n/unassign @bad-user'
  const context = new utils.mockContext(issueCommentEvent)

  await handleIssueComment(context)
  expect(assign.assign).toHaveBeenCalledTimes(1)
  expect(unassign.unassign).toHaveBeenCalledTimes(1)
})
