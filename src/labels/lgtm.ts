import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

import {getCommandArgs} from '../utils/command'
import {labelIssue, cancelLabel} from '../utils/labeling'
import {assertAuthorizedByOwnersOrMembership} from '../utils/auth'

/**
 * /lgtm will add the lgtm label.
 * Note - this label is used to indicate automatic merging
 * if the user has configured a cron job to perform automatic merging
 *
 * @param context - the github actions event context
 */
export const lgtm = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)

  const issueNumber: number | undefined = context.payload.issue?.number
  const commentBody: string = context.payload['comment']['body']
  const commenterId: string = context.payload['comment']['user']['login']

  if (issueNumber === undefined) {
    throw new Error(
      `github context payload missing issue number: ${context.payload}`
    )
  }

  await assertAuthorizedByOwnersOrMembership(octokit, context, 'reviewers', commenterId)

  const commentArgs: string[] = getCommandArgs('/lgtm', commentBody)

  // check if canceling last review
  if (commentArgs.length !== 0 && commentArgs[0] == "cancel") {
    try {
      await cancelLabel(octokit, context, issueNumber, 'lgtm')
    } catch (e) {
      throw new Error(`could not remove latest review: ${e}`)
    }
    return
  }

  labelIssue(octokit, context, issueNumber, ['lgtm'])
}
