import * as github from '@actions/github'
import * as core from '@actions/core'

import {getCommandArgs} from '../utils/command'

import {Context} from '@actions/github/lib/context'

export const assign = async (
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

  const commentArgs: string[] = getCommandArgs('/assign', commentBody)

  // no arguments after command provided
  if (commentArgs.length === 0) {
    await selfAssign(octokit, context, issueNumber, commenterId)
    return
  }

  // Only users who:
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
      // TODO - bail, no auth users. Error message?
      return

    default:
      await octokit.issues.addAssignees({
        ...context.repo,
        issue_number: issueNumber,
        assignees: authUsers
      })
      break
  }
}

const checkOrgMember = async (
  octokit: github.GitHub,
  context: Context,
  user: string
): Promise<boolean> => {
  try {
    if (context.payload.repository === undefined) {
      // TODO - repository is broken, error message?
      return false
    }

    await octokit.orgs.checkMembership({
      org: context.payload.repository.owner.login,
      username: user
    })

    return true
  } catch (e) {
    return false
  }
}

const checkCollaborator = async (
  octokit: github.GitHub,
  context: Context,
  user: string
): Promise<boolean> => {
  try {
    await octokit.repos.checkCollaborator({
      ...context.repo,
      username: user
    })

    return true
  } catch (e) {
    return false
  }
}

const checkIssueComments = async (
  octokit: github.GitHub,
  context: Context,
  issueNum: number,
  user: string
): Promise<boolean> => {
  try {
    const comments = await octokit.issues.listComments({
      ...context.repo,
      issue_number: issueNum
    })

    for (const e of comments.data) {
      if (e.user.login === user) {
        return true
      }
    }

    return false
  } catch (e) {
    return false
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
