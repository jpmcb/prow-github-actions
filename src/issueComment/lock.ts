import * as github from '@actions/github'
import * as core from '@actions/core'
import {Octokit} from '@octokit/rest'

import {Context} from '@actions/github/lib/context'

import {checkCollaborator} from '../utils/auth'
import {getCommandArgs} from '../utils/command'

/**
 * /lock will lock the issue / PR.
 * No more comments will be permitted
 *
 * @param context - the github actions event context
 */
export const lock = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new Octokit({
    auth: token
  })

  const issueNumber: number | undefined = context.payload.issue?.number
  const commenterId: string = context.payload.comment?.user?.login
  const commentBody: string = context.payload.comment?.body

  if (issueNumber === undefined) {
    throw new Error(
      `github context payload missing issue number: ${context.payload}`
    )
  }

  const commentArgs: string[] = getCommandArgs('/lock', commentBody)

  // Only users who:
  // - are collaborators
  let isAuthUser: Boolean = false
  try {
    isAuthUser = await checkCollaborator(octokit, context, commenterId)
  } catch (e) {
    throw new Error(`could not check commenter auth: ${e}`)
  }

  if (isAuthUser) {
    if (commentArgs.length > 0) {
      switch (commentArgs[0]) {
        case 'resolved':
          try {
            /* eslint-disable @typescript-eslint/naming-convention */
            await octokit.issues.lock({
              ...context.repo,
              issue_number: issueNumber
            })
            /* eslint-enable @typescript-eslint/naming-convention */
          } catch (e) {
            throw new Error(`could not lock issue: ${e}`)
          }
          break

        case 'off-topic':
          try {
            /* eslint-disable @typescript-eslint/naming-convention */
            await octokit.issues.lock({
              ...context.repo,
              issue_number: issueNumber,
              lock_reason: 'off-topic'
            })
            /* eslint-enable @typescript-eslint/naming-convention */
          } catch (e) {
            throw new Error(`could not lock issue: ${e}`)
          }
          break

        case 'too-heated':
          try {
            /* eslint-disable @typescript-eslint/naming-convention */
            await octokit.issues.lock({
              ...context.repo,
              issue_number: issueNumber,
              lock_reason: 'too heated'
            })
            /* eslint-enable @typescript-eslint/naming-convention */
          } catch (e) {
            throw new Error(`could not lock issue: ${e}`)
          }
          break

        case 'spam':
          try {
            /* eslint-disable @typescript-eslint/naming-convention */
            await octokit.issues.lock({
              ...context.repo,
              issue_number: issueNumber,
              lock_reason: 'spam'
            })
            /* eslint-enable @typescript-eslint/naming-convention */
          } catch (e) {
            throw new Error(`could not lock issue: ${e}`)
          }
          break

        default:
          try {
            /* eslint-disable @typescript-eslint/naming-convention */
            await octokit.issues.lock({
              ...context.repo,
              issue_number: issueNumber
            })
            /* eslint-enable @typescript-eslint/naming-convention */
          } catch (e) {
            throw new Error(`could not lock issue: ${e}`)
          }
          break
      }
    } else {
      try {
        /* eslint-disable @typescript-eslint/naming-convention */
        await octokit.issues.lock({
          ...context.repo,
          issue_number: issueNumber
        })
        /* eslint-enable @typescript-eslint/naming-convention */
      } catch (e) {
        throw new Error(`could not lock issue: ${e}`)
      }
    }
  } else {
    throw new Error(`commenter is not a collaborator user`)
  }
}
