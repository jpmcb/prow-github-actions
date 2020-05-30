import * as github from '@actions/github'

import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

import {cronLabelPr} from './prLabeler'
import {cronLgtm} from './lgtm'

/**
 * This Method handles any cron job events.
 * A user should define which of the jobs they want to run in their workflow yaml
 *
 * @param context - the github context of the current action event
 */
export const handleCronJobs = async (
  context: Context = github.context
): Promise<void> => {
  const runConfig = core.getInput('jobs', {required: false}).split(' ')

  await Promise.all(
    runConfig.map(async command => {
      switch (command) {
        case 'pr-labeler':
          core.debug('running cronLabelPr job')
          return await cronLabelPr(1, context).catch(async e => {
            return e
          })

        case 'lgtm':
          core.debug('running cronLgtm job')
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
      // Check to see if any of the promises failed
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
