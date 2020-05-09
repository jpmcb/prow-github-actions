import * as github from '@actions/github'

import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

import {labelPr} from './prLabeler'

export const handlePullReq = async (
  context: Context = github.context
): Promise<void> => {
  const runConfig = core.getInput('auto-run', {required: false}).split(' ')

  await Promise.all(
    runConfig.map(async command => {
      switch (command) {
        case 'pr-labeler':
          await labelPr(context)
          break

        default:
          break
      }
    })
  )

  return
}
