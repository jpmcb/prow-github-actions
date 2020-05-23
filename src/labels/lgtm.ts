import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

import {getCommandArgs} from '../utils/command'
import {labelIssue, removeLabels, getCurrentLabels} from '../utils/labeling'

export const lgtm = async (
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

  const commentArgs: string[] = getCommandArgs('/lgtm', commentBody)

  // check if canceling last review
  if (commentArgs.length !== 0 && commentArgs[0]) {
    try {
      await cancel(octokit, context, issueNumber)
    } catch (e) {
      throw new Error(`could not remove latest review: ${e}`)
    }
    return
  }

  labelIssue(octokit, context, issueNumber, ['lgtm'])
}

const cancel = async (
  octokit: github.GitHub,
  context: Context,
  issueNumber: number
): Promise<void> => {
  let currentLabels: string[] = []
  try {
    currentLabels = await getCurrentLabels(octokit, context, issueNumber)
    core.debug(`remove: found labels for issue ${currentLabels}`)
  } catch (e) {
    throw new Error(`could not get labels from issue: ${e}`)
  }

  if (currentLabels.includes('lgtm')) {
    try {
      await removeLabels(octokit, context, issueNumber, ['lgtm'])
    } catch (e) {
      throw new Error(`could not remove lgtm label: ${e}`)
    }
  } else {
    core.debug('could not find lgtm to remove')
  }
}
