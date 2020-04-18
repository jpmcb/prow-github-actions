import * as github from '@actions/github'
import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

export const assign = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})

  const issueNumber: number | undefined = context.payload.issue?.number
  const commenterId: string = context.payload['comment']['user']['login']

  const octokit = new github.GitHub(token)

  await octokit.issues.addAssignees({
    ...context.repo,
    issue_number: issueNumber!, // eslint-disable-line camelcase
    assignees: [commenterId]
  })
}
