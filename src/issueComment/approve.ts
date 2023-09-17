import * as github from '@actions/github'
import * as core from '@actions/core'
import {Endpoints} from '@octokit/types'

import {Octokit} from '@octokit/rest'
import {Context} from '@actions/github/lib/context'
import {getCommandArgs} from '../utils/command'
import {assertAuthorizedByOwnersOrMembership} from '../utils/auth'
import {createComment} from '../utils/comments'

type PullsListReviewsResponseType =
  Endpoints['GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews']['response']

/**
 * the /approve command will create a "approve" review
 * from the github-actions bot
 *
 * If the argument 'cancel' is provided to the /approve command
 * the last review will be removed
 *
 * @param context - the github actions event context
 */
export const approve = async (
  context: Context = github.context
): Promise<void> => {
  core.debug(`starting approve job`)
  const token = core.getInput('github-token', {required: true})
  const octokit = new Octokit({
    auth: token
  })

  const issueNumber: number | undefined = context.payload.issue?.number
  const commentBody: string = context.payload.comment?.body
  const commenterLogin: string = context.payload.comment?.user.login

  if (issueNumber === undefined) {
    throw new Error(
      `github context payload missing issue number: ${context.payload}`
    )
  }

  try {
    await assertAuthorizedByOwnersOrMembership(
      octokit,
      context,
      'approvers',
      commenterLogin
    )
  } catch (e) {
    const msg = `Cannot approve the pull request: ${e}`
    core.error(msg)

    // Try to reply back that the user is unauthorized
    try {
      createComment(octokit, context, issueNumber, msg)
    } catch (commentE) {
      // Log the comment error but continue to throw the original auth error
      core.error(`Could not comment with an auth error: ${commentE}`)
    }
    throw e
  }

  const commentArgs: string[] = getCommandArgs('/approve', commentBody)

  // check if canceling last review
  if (commentArgs.length !== 0 && commentArgs[0] === 'cancel') {
    try {
      await cancel(octokit, context, issueNumber, commenterLogin)
    } catch (e) {
      throw new Error(`could not remove latest review: ${e}`)
    }
    return
  }

  try {
    core.debug(`creating a review`)
    /* eslint-disable @typescript-eslint/naming-convention */
    await octokit.pulls.createReview({
      ...context.repo,
      pull_number: issueNumber,
      event: 'APPROVE',
      comments: []
    })
    /* eslint-enable @typescript-eslint/naming-convention */
  } catch (e) {
    throw new Error(`could not create review: ${e}`)
  }
}

/**
 * Removes the latest review from the github actions bot
 *
 * @param octokit - a hydrated github api client
 * @param context - the github actions workflow event context
 * @param issueNumber - the PR to remove the review
 * @param commenterLogin - the login name of the user who made comment
 */
const cancel = async (
  octokit: Octokit,
  context: Context,
  issueNumber: number,
  commenterLogin: string
): Promise<void> => {
  core.debug(`canceling latest review`)

  let reviews: PullsListReviewsResponseType
  try {
    /* eslint-disable @typescript-eslint/naming-convention */
    reviews = await octokit.pulls.listReviews({
      ...context.repo,
      pull_number: issueNumber
    })
    /* eslint-enable @typescript-eslint/naming-convention */
  } catch (e) {
    throw new Error(`could not list reviews for PR ${issueNumber}: ${e}`)
  }

  let latestReview = undefined

  for (const e of reviews.data) {
    core.debug(`checking review: ${e.user?.login}`)
    if (e.user?.login === 'github-actions[bot]' && e.state === 'APPROVED') {
      latestReview = e
    }
  }

  if (latestReview === undefined) {
    throw new Error('no latest review found to cancel')
  }

  try {
    /* eslint-disable @typescript-eslint/naming-convention */
    await octokit.pulls.dismissReview({
      ...context.repo,
      pull_number: issueNumber,
      review_id: latestReview.id,
      message: `Canceled through prow-github-actions by @${commenterLogin}`
    })
    /* eslint-enable @typescript-eslint/naming-convention */
  } catch (e) {
    throw new Error(`could not dismiss review: ${e}`)
  }
}
