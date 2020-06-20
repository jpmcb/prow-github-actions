import * as github from '@actions/github'
import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

import {checkCollaborator} from '../utils/auth'

/**
 * /close will close the issue / PR
 *
 * @param context - the github actions event context
 */
export const close = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)

  const issueNumber: number | undefined = context.payload.issue?.number
  const commenterId: string = context.payload['comment']['user']['login']

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
    throw new Error(`could not check commentor auth: ${e}`)
  }

  if (isAuthUser) {
    try {
      await octokit.issues.update({
        ...context.repo,
        issue_number: issueNumber,
        state: 'closed'
      })
    } catch (e) {
      throw new Error(`could not close issue: ${e}`)
    }
  }
}
