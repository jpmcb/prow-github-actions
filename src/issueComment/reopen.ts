import * as github from '@actions/github'
import * as core from '@actions/core'
import {Octokit} from '@octokit/rest'

import {Context} from '@actions/github/lib/context'

import {checkCollaborator} from '../utils/auth'

/**
 * /reopen will reopen the issue / PR. May be called after /close
 *
 * @param context - the github actions event context
 */
export const reopen = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new Octokit({
    auth: token
  })

  const issueNumber: number | undefined = context.payload.issue?.number
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
    throw new Error(`could not check commentor auth: ${e}`)
  }

  if (isAuthUser) {
    try {
      /* eslint-disable @typescript-eslint/naming-convention */
      await octokit.issues.update({
        ...context.repo,
        issue_number: issueNumber,
        state: 'open'
      })
      /* eslint-enable @typescript-eslint/naming-convention */
    } catch (e) {
      throw new Error(`could not open issue: ${e}`)
    }
  }
}
