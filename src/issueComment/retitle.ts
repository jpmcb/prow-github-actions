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
    // TODO - Bail, issue number not defined :(
    //    want some error messaging here?
    return
  }

  const commentArgs: string[] = getCommandArgs('/retitle', commentBody)

  // no arguments after command provided. Can't retitle!
  if (commentArgs.length === 0) {
    return
  }

  // Only users who:
  // - are collaborators
  const isAuthUser = await checkCommenterAuth(octokit, context, commenterId)

  if (isAuthUser) {
    await octokit.issues.update({
      ...context.repo,
      issue_number: issueNumber,
      title: commentArgs.join(' ')
    })
  }
}

const checkCommenterAuth = async (
  octokit: github.GitHub,
  context: Context,
  user: string
): Promise<Boolean> => {
  const isCollaborator = await checkCollaborator(octokit, context, user)

  if (isCollaborator) {
    return true
  }

  return false
}
