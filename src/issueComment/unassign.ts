import * as github from '@actions/github'
import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

import {getCommandArgs} from '../utils/command'
import {
  checkCollaborator,
  checkIssueComments,
  checkOrgMember
} from '../utils/auth'

export const unassign = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('bot-token', {required: true})
  const octokit = new github.GitHub(token)

  const issueNumber: number | undefined = context.payload.issue?.number
  const commenterId: string = context.payload['comment']['user']['login']
  const commentBody: string = context.payload['comment']['body']

  if (issueNumber === undefined) {
    throw new Error(
      `github context payload missing issue number: ${context.payload}`
    )
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

  const isAuthUser = await checkCommenterAuth(
    octokit,
    context,
    issueNumber,
    commenterId
  )

  if (isAuthUser) {
    await octokit.issues.removeAssignees({
      ...context.repo,
      issue_number: issueNumber,
      assignees: commentArgs
    })
  }
}

const checkCommenterAuth = async (
  octokit: github.GitHub,
  context: Context,
  issueNum: number,
  user: string
): Promise<Boolean> => {
  const isOrgMember = await checkOrgMember(octokit, context, user)
  const isCollaborator = await checkCollaborator(octokit, context, user)
  const hasCommented = await checkIssueComments(
    octokit,
    context,
    issueNum,
    user
  )

  if (isOrgMember || isCollaborator || hasCommented) {
    return true
  }

  return false
}
