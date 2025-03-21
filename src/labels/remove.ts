import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'

import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

import {getCommandArgs} from '../utils/command'
import {getCurrentLabels, removeLabels} from '../utils/labeling'
import {checkCollaborator} from '../utils/auth'

/**
 * /remove will remove a label based on the command argument
 *
 * @param context - the github actions event context
 */
export const remove = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new Octokit({
    auth: token
  })

  const issueNumber: number | undefined = context.payload.issue?.number
  const commentBody: string = context.payload.comment?.body
  const commenterId: string = context.payload.comment?.user?.login

  if (issueNumber === undefined) {
    throw new Error(
      `github context payload missing issue number: ${context.payload}`
    )
  }

  // Only users who:
  // - are collaborators
  let isAuthUser: Boolean = false
  try {
    isAuthUser = await checkCollaborator(octokit, context, commenterId)
  } catch (e) {
    throw new Error(`could not check commenter auth: ${e}`)
  }

  if (!isAuthUser) {
    throw new Error(
      `commenter is not authorized to remove a label. Must be repo collaborator`
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
