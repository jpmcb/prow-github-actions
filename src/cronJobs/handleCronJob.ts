import * as github from '@actions/github'

import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

import {cronLabelPr} from './prLabeler'
import {cronLgtm} from './lgtm'

export const handleCronJobs = async (
  context: Context = github.context
): Promise<void> => {
  const runConfig = core.getInput('jobs', {required: false}).split(' ')

  await Promise.all(
    runConfig.map(async command => {
      switch (command) {
        case 'pr-labeler':
          return await cronLabelPr(1, context).catch(async e => {
            return e
          })

        case 'lgtm':
          return await cronLgtm(1, context).catch(async e => {
            return e
          })

        case '':
          return new Error(
            `please provide a list of space delimited commands / jobs to run. None found`
          )

        default:
          return new Error(
            `could not execute ${command}. May not be supported - please refer to docs`
          )
      }
    })
  )
    .then(results => {
      for (const result of results) {
        if (result instanceof Error) {
          throw new Error(`error handling issue comment: ${result}`)
        }
      }
    })
    .catch(e => {
      core.setFailed(`${e}`)
    })

  return
}
