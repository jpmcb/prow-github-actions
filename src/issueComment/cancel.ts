import * as github from '@actions/github'
import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

export const cancel = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)
  const commenterId: string = context.payload['comment']['user']['login']

  const issueNumber: number | undefined = context.payload.issue?.number

  if (issueNumber === undefined) {
    throw new Error(
      `github context payload missing issue number: ${context.payload}`
    )
  }

  const reviews = await octokit.pulls.listReviews({
    ...context.repo,
    pull_number: issueNumber
  })

  let latestReview = undefined
  for (const e of reviews.data) {
    if (e.user.login === commenterId) {
      latestReview = e
    }
  }

  if (latestReview === undefined) {
    throw new Error('no latest review found to cancel')
  }

  octokit.pulls.dismissReview({
    ...context.repo,
    pull_number: issueNumber,
    review_id: latestReview.id,
    message: 'Canceled by prow-github-actions bot'
  })
}
