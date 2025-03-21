import * as github from '@actions/github'
import * as core from '@actions/core'
import {Octokit} from '@octokit/rest'

import {Context} from '@actions/github/lib/context'

import {getCommandArgs} from '../utils/command'
import {checkCollaborator, checkCommenterAuth} from '../utils/auth'

/**
 * /uncc will remove the review request for argument users (or self)
 *
 * @param context - the github actions event context
 */
export const uncc = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new Octokit({
    auth: token
  })

  const pullNumber: number | undefined = context.payload.issue?.number
  const commenterId: string = context.payload.comment?.user?.login
  const commentBody: string = context.payload.comment?.body

  if (pullNumber === undefined) {
    throw new Error(
      `github context payload missing pull number: ${context.payload}`
    )
  }

  const commentArgs: string[] = getCommandArgs('/uncc', commentBody)

  // no arguments after command provided
  if (commentArgs.length === 0) {
    try {
      await removeSelfReviewReq(octokit, context, pullNumber, commenterId)
    } catch (e) {
      throw new Error(`could not self uncc: ${e}`)
    }
    return
  }

  // Only target users who:
  // - are members of the org
  // - are collaborators
  // - have previously commented on this issue
  let authUser: Boolean = false
  try {
    authUser = await checkCommenterAuth(
      octokit,
      context,
      pullNumber,
      commenterId
    )
  } catch (e) {
    throw new Error(`could not get authorized users: ${e}`)
  }

  if (authUser) {
    /* eslint-disable @typescript-eslint/naming-convention */
    await octokit.pulls.removeRequestedReviewers({
      ...context.repo,
      pull_number: pullNumber,
      reviewers: commentArgs
    })
    /* eslint-enable @typescript-eslint/naming-convention */
  }
}

/**
 * removeSelfReviewReq will remove the self review req if no arguments were provided
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param pullNum - the pr number this runtime is associated with
 * @param user - the user to self assign
 */
const removeSelfReviewReq = async (
  octokit: Octokit,
  context: Context,
  pullNum: number,
  user: string
): Promise<void> => {
  const isCollaborator = await checkCollaborator(octokit, context, user)

  if (isCollaborator) {
    /* eslint-disable @typescript-eslint/naming-convention */
    await octokit.pulls.removeRequestedReviewers({
      ...context.repo,
      pull_number: pullNum,
      reviewers: [user]
    })
    /* eslint-enable @typescript-eslint/naming-convention */
  }
}
