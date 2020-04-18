import * as core from '@actions/core'
import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'

import {assign} from './assign'

export const handleIssueComment = async (
  context: Context = github.context
): Promise<void> => {
  const command = core.getInput('prow-command', {required: true})
  const commentBody: string = context.payload['comment']['body']

  if (commentBody.includes(command)) {
    switch (command) {
      case '/assign':
        await assign(context)
        break

      default:
        core.error(
          `could not execute ${command}. May not be supported - please refer to docs`
        )
    }
  }
}
