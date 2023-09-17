import * as core from '@actions/core'
import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'

import {assign} from './assign'
import {unassign} from './unassign'
import {approve} from './approve'
import {retitle} from './retitle'
import {remove} from '../labels/remove'
import {area} from '../labels/area'
import {kind} from '../labels/kind'
import {priority} from '../labels/priority'
import {lgtm} from '../labels/lgtm'
import {hold} from '../labels/hold'
import {close} from './close'
import {reopen} from './reopen'
import {lock} from './lock'
import {cc} from './cc'
import {uncc} from './uncc'
import {milestone} from './milestone'

/**
 * This Method handles any issue comments
 * Note that the github api considers PRs issues
 * A user should define which of the commands they want to run in their workflow yaml
 *
 * @param context - the github context of the current action event
 */
export const handleIssueComment = async (
  context: Context = github.context
): Promise<void> => {
  const commandConfig = core
    .getInput('prow-commands', {required: false})
    .replace(/\n/g, ' ')
    .split(' ')
  const commentBody: string = context.payload.comment?.body

  await Promise.all(
    commandConfig.map(async command => {
      if (commentBody.includes(command)) {
        switch (command) {
          case '/assign':
            return await assign(context).catch(async e => {
              return e
            })

          case '/cc':
            return await cc(context).catch(async e => {
              return e
            })

          case '/uncc':
            return await uncc(context).catch(async e => {
              return e
            })

          case '/unassign':
            return await unassign(context).catch(async e => {
              return e
            })

          case '/approve':
            return await approve(context).catch(async e => {
              return e
            })

          case '/retitle':
            return await retitle(context).catch(async e => {
              return e
            })

          case '/remove':
            return await remove(context).catch(async e => {
              return e
            })

          case '/area':
            return await area(context).catch(async e => {
              return e
            })

          case '/kind':
            return await kind(context).catch(async e => {
              return e
            })

          case '/hold':
            return await hold(context).catch(async e => {
              return e
            })

          case '/priority':
            return await priority(context).catch(async e => {
              return e
            })

          case '/lgtm':
            return await lgtm(context).catch(async e => {
              return e
            })

          case '/close':
            return await close(context).catch(async e => {
              return e
            })

          case '/lock':
            return await lock(context).catch(async e => {
              return e
            })

          case '/reopen':
            return await reopen(context).catch(async e => {
              return e
            })

          case '/milestone':
            return await milestone(context).catch(async e => {
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
}
