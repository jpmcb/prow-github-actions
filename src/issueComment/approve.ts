import * as github from '@actions/github'
import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

export const approve = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)

  const issueNumber: number | undefined = context.payload.issue?.number

  if (issueNumber === undefined) {
    throw new Error(
      `github context payload missing issue number: ${context.payload}`
    )
  }

  try {
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
