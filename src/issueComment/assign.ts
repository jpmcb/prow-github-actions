import * as github from '@actions/github'
import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

import {getCommandArgs} from '../utils/command'
import {
  checkCollaborator,
  checkIssueComments,
  checkOrgMember
} from '../utils/auth'

export const assign = async (
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

  const commentArgs: string[] = getCommandArgs('/assign', commentBody)

  // no arguments after command provided
  if (commentArgs.length === 0) {
    await selfAssign(octokit, context, issueNumber, commenterId)
    return
  }

  // Only target users who:
  // - are members of the org
  // - are collaborators
  // - have previously commented on this issue
  const authUsers = await getAuthUsers(
    octokit,
    context,
    issueNumber,
    commentArgs
  )

  switch (authUsers.length) {
    case 0:
      throw new Error(
        `no authorized users found. Only users who are members of the org, are collaborators, or have previously commented on this issue may be assigned`
      )

    default:
      await octokit.issues.addAssignees({
        ...context.repo,
        issue_number: issueNumber,
        assignees: authUsers
      })
      break
  }
}

const getAuthUsers = async (
  octokit: github.GitHub,
  context: Context,
  issueNum: number,
  args: string[]
): Promise<string[]> => {
  const toReturn: string[] = []

  await Promise.all(
    args.map(async arg => {
      const isOrgMember = await checkOrgMember(octokit, context, arg)
      const isCollaborator = await checkCollaborator(octokit, context, arg)
      const hasCommented = await checkIssueComments(
        octokit,
        context,
        issueNum,
        arg
      )

      if (isOrgMember || isCollaborator || hasCommented) {
        toReturn.push(arg)
      }
    })
  )

  return toReturn
}

const selfAssign = async (
  octokit: github.GitHub,
  context: Context,
  issueNum: number,
  user: string
): Promise<void> => {
  const isOrgMember = await checkOrgMember(octokit, context, user)
  const isCollaborator = await checkCollaborator(octokit, context, user)
  const hasCommented = await checkIssueComments(
    octokit,
    context,
    issueNum,
    user
  )

  if (isOrgMember || isCollaborator || hasCommented) {
    await octokit.issues.addAssignees({
      ...context.repo,
      issue_number: issueNum,
      assignees: [user]
    })
  }
}
