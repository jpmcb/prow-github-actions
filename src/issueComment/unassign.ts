import * as github from '@actions/github'
import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

export const unassign = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})

  const issueNumber: number | undefined = context.payload.issue?.number
  const commenterId: string = context.payload['comment']['user']['login']

  const octokit = new github.GitHub(token)

  await octokit.issues.removeAssignees({
    ...context.repo,
    issue_number: issueNumber!,
    assignees: [commenterId]
  })
}
