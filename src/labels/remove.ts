import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

import {getCommandArgs} from '../utils/command'
import {getCurrentLabels, removeLabels} from '../utils/labeling'

export const remove = async (
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

  let toRemove: string[] = getCommandArgs('/remove', commentBody)

  let currentLabels: string[] = []
  try {
    currentLabels = await getCurrentLabels(octokit, context, issueNumber)
    core.debug(`remove: found labels for issue ${currentLabels}`)
  } catch (e) {
    throw new Error(`could not get labels from issue: ${e}`)
  }

  toRemove = toRemove.filter(e => {
    return currentLabels.includes(e)
  })

  // no arguments after command provided
  if (toRemove.length === 0) {
    throw new Error(`area: command args missing from body`)
  }

  await removeLabels(octokit, context, issueNumber, toRemove)
}
