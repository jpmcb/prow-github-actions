import * as github from '@actions/github'
import * as core from '@actions/core'

import {Octokit} from '@octokit/rest'
import {Context} from '@actions/github/lib/context'
import {getCommandArgs} from '../utils/command'

export const approve = async (
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

  const commentArgs: string[] = getCommandArgs('/approve', commentBody)

  // check if canceling last review
  if (commentArgs.length !== 0 && commentArgs[0]) {
    try {
      await cancel(octokit, context, issueNumber)
    } catch (e) {
      throw new Error(`could not remove latest review: ${e}`)
    }
    return
  }

  try {
    core.debug(`creating a review`)
    await octokit.pulls.createReview({
      ...context.repo,
      pull_number: issueNumber,
      event: 'APPROVE',
      comments: []
    })
  } catch (e) {
    throw new Error(`could not create review: ${e}`)
  }
}

const cancel = async (
  octokit: github.GitHub,
  context: Context,
  issueNumber: number
): Promise<void> => {
  core.debug(`canceling latest review`)

  let reviews: Octokit.Response<Octokit.PullsListReviewsResponse>
  try {
    reviews = await octokit.pulls.listReviews({
      ...context.repo,
      pull_number: issueNumber
    })
  } catch (e) {
    throw new Error(`could not list reviews for PR ${issueNumber}: ${e}`)
  }

  let latestReview = undefined
  for (const e of reviews.data) {
    core.debug(`checking review: ${e.user.login}`)
    if (e.user.login === 'github-actions') {
      latestReview = e
    }
  }

  if (latestReview === undefined) {
    throw new Error('no latest review found to cancel')
  }

  try {
    await octokit.pulls.dismissReview({
      ...context.repo,
      pull_number: issueNumber,
      review_id: latestReview.id,
      message: 'Canceled by prow-github-actions bot'
    })
  } catch (e) {
    throw new Error(`could not dismiss review: ${e}`)
  }
}
