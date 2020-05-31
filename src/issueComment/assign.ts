import * as github from '@actions/github'
import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

import {getCommandArgs} from '../utils/command'
import {
  checkCollaborator,
  checkIssueComments,
  checkOrgMember
} from '../utils/auth'

/**
 * /assign will self assign with no argument
 * or assign the users in the argument list
 *
 * @param context - the github actions event context
 */
export const assign = async (
  context: Context = github.context
): Promise<void> => {
  core.debug(`starting assign job`)

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

  const commentArgs: string[] = getCommandArgs('/assign', commentBody)

  // no arguments after command provided
  if (commentArgs.length === 0) {
    try {
      await selfAssign(octokit, context, issueNumber, commenterId)
    } catch (e) {
      throw new Error(`could not self assign: ${e}`)
    }
    return
  }

  // Only target users who:
  // - are members of the org
  // - are collaborators
  // - have previously commented on this issue
  let authUsers: string[] = []
  try {
    authUsers = await getAuthUsers(octokit, context, issueNumber, commentArgs)
  } catch (e) {
    throw new Error(`could not get authorized users: ${e}`)
  }

  switch (authUsers.length) {
    case 0:
      throw new Error(
        `no authorized users found. Only users who are members of the org, are collaborators, or have previously commented on this issue may be assigned`
      )

    default:
      try {
        await octokit.issues.addAssignees({
          ...context.repo,
          issue_number: issueNumber,
          assignees: authUsers
        })
      } catch (e) {
        throw new Error(`could not add assignees: ${e}`)
      }
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

  try {
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
  } catch (e) {
    throw new Error(`could not get authorized user: ${e}`)
  }

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
