import * as github from '@actions/github'

import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

import {labelPr} from './prLabeler'

export const handlePullReq = async (
  context: Context = github.context
): Promise<void> => {
  const runConfig = core.getInput('jobs', {required: false}).split(' ')

  await Promise.all(
    runConfig.map(async command => {
      switch (command) {
        case 'pr-labeler':
          await labelPr(context)
          break

        case '':
          throw new Error(
            `please provide a list of space delimited commands / jobs to run. None found`
          )

        default:
          throw new Error(
            `could not execute ${command}. May not be supported - please refer to docs`
          )
      }
    })
  )

  return
}
