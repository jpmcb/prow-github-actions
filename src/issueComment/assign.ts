import * as github from '@actions/github'
import * as core from '@actions/core'

import {Octokit} from '@octokit/rest'

import {Context} from '@actions/github/lib/context'

import {getCommandArgs} from '../utils/command'
import {getOrgCollabCommentUsers, checkCommenterAuth} from '../utils/auth'

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
  const octokit = new Octokit({
    auth: token
  })

  const issueNumber: number | undefined = context.payload.issue?.number
  const commenterId: string = context.payload.comment?.user?.login
  const commentBody: string = context.payload.comment?.body

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
    authUsers = await getOrgCollabCommentUsers(
      octokit,
      context,
      issueNumber,
      commentArgs
    )
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
        /* eslint-disable @typescript-eslint/naming-convention */
        await octokit.issues.addAssignees({
          ...context.repo,
          issue_number: issueNumber,
          assignees: authUsers
        })
        /* eslint-enable @typescript-eslint/naming-convention */
      } catch (e) {
        throw new Error(`could not add assignees: ${e}`)
      }
      break
  }
}

/**
 * selfAssign will assign the issue / pr to the user who commented
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param issueNum - the issue or pr number this runtime is associated with
 * @param user - the user to self assign
 */
const selfAssign = async (
  octokit: Octokit,
  context: Context,
  issueNum: number,
  user: string
): Promise<void> => {
  const isAuthorized = await checkCommenterAuth(
    octokit,
    context,
    issueNum,
    user
  )

  if (isAuthorized) {
    /* eslint-disable @typescript-eslint/naming-convention */
    await octokit.issues.addAssignees({
      ...context.repo,
      issue_number: issueNum,
      assignees: [user]
    })
    /* eslint-enable @typescript-eslint/naming-convention */
  }
}
