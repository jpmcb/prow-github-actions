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
  const token = core.getInput('github-token', {required: true})
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
    try {
      await octokit.issues.removeAssignees({
        ...context.repo,
        issue_number: issueNumber,
        assignees: [commenterId]
      })
    } catch (e) {
      throw new Error(`could not remove assignee: ${e}`)
    }

    return
  }

  let isAuthUser: Boolean = false
  try {
    isAuthUser = await checkCommenterAuth(
      octokit,
      context,
      issueNumber,
      commenterId
    )
  } catch (e) {
    throw new Error(`couldn ot check commentor Auth: ${e}`)
  }

  if (isAuthUser) {
    try {
      await octokit.issues.removeAssignees({
        ...context.repo,
        issue_number: issueNumber,
        assignees: commentArgs
      })
    } catch (e) {
      throw new Error(`could not remove assignee: ${e}`)
    }
  }
}

const checkCommenterAuth = async (
  octokit: github.GitHub,
  context: Context,
  issueNum: number,
  user: string
): Promise<Boolean> => {
  let isOrgMember: Boolean = false
  let isCollaborator: Boolean = false
  let hasCommented: Boolean = false

  try {
    isOrgMember = await checkOrgMember(octokit, context, user)
  } catch (e) {
    throw new Error(`error in checking org member: ${e}`)
  }

  try {
    isCollaborator = await checkCollaborator(octokit, context, user)
  } catch (e) {
    throw new Error(`could not check collaborator: ${e}`)
  }

  try {
    hasCommented = await checkIssueComments(octokit, context, issueNum, user)
  } catch (e) {
    throw new Error(`could not check issue comments: ${e}`)
  }

  if (isOrgMember || isCollaborator || hasCommented) {
    return true
  }

  return false
}
