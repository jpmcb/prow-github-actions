import * as github from '@actions/github'

import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'
import {onPrLgtm} from './onPrLgtm'

/**
 * This method handles any pull-request configuration for configured workflows.
 * At this time, there are no commands for prow-github-actions
 *
 * @param context - the github context of the current action event
 */
export const handlePullReq = async (
  context: Context = github.context
): Promise<void> => {
  const runConfig = core.getInput('jobs', {required: false}).split(' ')

  await Promise.all(
    runConfig.map(async command => {
      core.debug(`${context}`)
      switch (command) {
        case 'lgtm':
          core.debug('running pr lgtm new commit job')
          return await onPrLgtm(context).catch(async e => {
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
