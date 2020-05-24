import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

import {getCommandArgs} from '../utils/command'
import {labelIssue, cancelLabel} from '../utils/labeling'

export const hold = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)

  const issueNumber: number | undefined = context.payload.issue?.number
  const commentBody: string = context.payload['comment']['body']

  if (issueNumber === undefined) {
    throw new Error(
      `github context payload missing issue number: ${context.payload}`
    )
  }

  const commentArgs: string[] = getCommandArgs('/hold', commentBody)

  // check if canceling last review
  if (commentArgs.length !== 0 && commentArgs[0]) {
    try {
      await cancelLabel(octokit, context, issueNumber, 'hold')
    } catch (e) {
      throw new Error(`could not remove the hold label: ${e}`)
    }
    return
  }

  labelIssue(octokit, context, issueNumber, ['hold'])
}
