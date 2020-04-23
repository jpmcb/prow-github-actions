import * as github from '@actions/github'
import * as core from '@actions/core'

import {getCommandArgs} from '../utils/command'

import {Context} from '@actions/github/lib/context'

export const unassign = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)

  const issueNumber: number | undefined = context.payload.issue?.number
  const commenterId: string = context.payload['comment']['user']['login']
  const commentBody: string = context.payload['comment']['body']

  if (issueNumber === undefined) {
    // TODO - Bail, issue number not defined :(
    //    want some error messaging here?
    return
  }

  const commentArgs: string[] = getCommandArgs('/unassign', commentBody)

  // no arguments after command provided
  if (commentArgs.length === 0) {
    await octokit.issues.removeAssignees({
      ...context.repo,
      issue_number: issueNumber,
      assignees: [commenterId]
    })

    return
  }

  await octokit.issues.removeAssignees({
    ...context.repo,
    issue_number: issueNumber,
    assignees: commentArgs
  })
}
