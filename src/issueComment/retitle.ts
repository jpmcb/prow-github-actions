import * as github from '@actions/github'
import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

import {getCommandArgs} from '../utils/command'
import {checkCollaborator} from '../utils/auth'

export const retitle = async (
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

  const commentArgs: string[] = getCommandArgs('/retitle', commentBody)

  // no arguments after command provided. Can't retitle!
  if (commentArgs.length === 0) {
    return
  }

  // Only users who:
  // - are collaborators
  let isAuthUser: Boolean = false
  try {
    isAuthUser = await checkCommenterAuth(octokit, context, commenterId)
  } catch (e) {
    throw new Error(`could not check Commentor auth: ${e}`)
  }

  if (isAuthUser) {
    try {
      await octokit.issues.update({
        ...context.repo,
        issue_number: issueNumber,
        title: commentArgs.join(' ')
      })
    } catch (e) {
      throw new Error(`could not update issue: ${e}`)
    }
  }
}

const checkCommenterAuth = async (
  octokit: github.GitHub,
  context: Context,
  user: string
): Promise<Boolean> => {
  let isCollaborator: Boolean = false
  try {
    isCollaborator = await checkCollaborator(octokit, context, user)
  } catch (e) {
    throw new Error(`error checking collaborator: ${e}`)
  }

  if (isCollaborator) {
    return true
  }

  return false
}
