import * as github from '@actions/github'
import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

import {getCommandArgs} from '../utils/command'
import {
  checkCollaborator,
  checkIssueComments,
  checkOrgMember
} from '../utils/auth'

export const uncc = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)

  const pullNumber: number | undefined = context.payload.issue?.number
  const commenterId: string = context.payload['comment']['user']['login']
  const commentBody: string = context.payload['comment']['body']

  if (pullNumber === undefined) {
    throw new Error(
      `github context payload missing pull number: ${context.payload}`
    )
  }

  const commentArgs: string[] = getCommandArgs('/uncc', commentBody)

  // no arguments after command provided
  if (commentArgs.length === 0) {
    try {
      await removeSelfReviewReq(octokit, context, pullNumber, commenterId)
    } catch (e) {
      throw new Error(`could not self uncc: ${e}`)
    }
    return
  }

  // Only target users who:
  // - are members of the org
  // - are collaborators
  // - have previously commented on this issue
  let authUser = false
  try {
    authUser = await getAuthUser(octokit, context, pullNumber, commenterId)
  } catch (e) {
    throw new Error(`could not get authorized users: ${e}`)
  }

  if (authUser) {
    await octokit.pulls.deleteReviewRequest({
      ...context.repo,
      pull_number: pullNumber,
      reviewers: commentArgs
    })
  }
}

const getAuthUser = async (
  octokit: github.GitHub,
  context: Context,
  pullnum: number,
  user: string
): Promise<boolean> => {
  try {
    const isOrgMember = await checkOrgMember(octokit, context, user)
    const isCollaborator = await checkCollaborator(octokit, context, user)
    const hasCommented = await checkIssueComments(
      octokit,
      context,
      pullnum,
      user
    )

    if (isOrgMember || isCollaborator || hasCommented) {
      return true
    }

    return false
  } catch (e) {
    throw new Error(`could not get authorized user: ${e}`)
  }
}

const removeSelfReviewReq = async (
  octokit: github.GitHub,
  context: Context,
  pullNum: number,
  user: string
): Promise<void> => {
  const isCollaborator = await checkCollaborator(octokit, context, user)

  if (isCollaborator) {
    await octokit.pulls.deleteReviewRequest({
      ...context.repo,
      pull_number: pullNum,
      reviewers: [user]
    })
  }
}
