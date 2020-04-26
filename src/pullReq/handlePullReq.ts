import * as github from '@actions/github'

import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

export const handleIssueComment = async (
  context: Context = github.context
): Promise<void> => {
  const commandConfig = core
    .getInput('prow-commands', {required: true})
    .split(' ')
  const commentBody: string = context.payload['comment']['body']

  await Promise.all(
    commandConfig.map(async command => {
      if (commentBody.includes(command)) {
        return
      }
    })
  )

  return
}
