import type { Context } from '@actions/github/lib/context'
import * as core from '@actions/core'

import * as github from '@actions/github'

import { area } from '../labels/area'
import { hold } from '../labels/hold'
import { kind } from '../labels/kind'
import { lgtm } from '../labels/lgtm'
import { priority } from '../labels/priority'
import { remove } from '../labels/remove'
import { approve } from './approve'
import { assign } from './assign'
import { cc } from './cc'
import { close } from './close'
import { lock } from './lock'
import { milestone } from './milestone'
import { reopen } from './reopen'
import { retitle } from './retitle'
import { unassign } from './unassign'
import { uncc } from './uncc'

/**
 * This Method handles any issue comments
 * Note that the github api considers PRs issues
 * A user should define which of the commands they want to run in their workflow yaml
 *
 * @param context - the github context of the current action event
 */
export async function handleIssueComment(context: Context = github.context): Promise<void> {
  const commandConfig = core
    .getInput('prow-commands', { required: false })
    .replace(/\n/g, ' ')
    .split(' ')
  const commentBody: string = context.payload.comment?.body

  await Promise.all(
    commandConfig.map(async (command) => {
      if (commentBody.includes(command)) {
        switch (command) {
          case '/assign':
            return await assign(context).catch(async (e) => {
              return e
            })

          case '/cc':
            return await cc(context).catch(async (e) => {
              return e
            })

          case '/uncc':
            return await uncc(context).catch(async (e) => {
              return e
            })

          case '/unassign':
            return await unassign(context).catch(async (e) => {
              return e
            })

          case '/approve':
            return await approve(context).catch(async (e) => {
              return e
            })

          case '/retitle':
            return await retitle(context).catch(async (e) => {
              return e
            })

          case '/remove':
            return await remove(context).catch(async (e) => {
              return e
            })

          case '/area':
            return await area(context).catch(async (e) => {
              return e
            })

          case '/kind':
            return await kind(context).catch(async (e) => {
              return e
            })

          case '/hold':
            return await hold(context).catch(async (e) => {
              return e
            })

          case '/priority':
            return await priority(context).catch(async (e) => {
              return e
            })

          case '/lgtm':
            return await lgtm(context).catch(async (e) => {
              return e
            })

          case '/close':
            return await close(context).catch(async (e) => {
              return e
            })

          case '/lock':
            return await lock(context).catch(async (e) => {
              return e
            })

          case '/reopen':
            return await reopen(context).catch(async (e) => {
              return e
            })

          case '/milestone':
            return await milestone(context).catch(async (e) => {
              return e
            })

          case '':
            return new Error(
              `please provide a list of space delimited commands / jobs to run. None found`,
            )

          default:
            return new Error(
              `could not execute ${command}. May not be supported - please refer to docs`,
            )
        }
      }
    }),
  )
    .then((results) => {
      for (const result of results) {
        if (result instanceof Error) {
          throw new TypeError(`error handling issue comment: ${result}`)
        }
      }
    })
    .catch((e) => {
      core.setFailed(`${e}`)
    })
}
