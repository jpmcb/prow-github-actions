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
import {rerun} from './rerun'
import {milestone} from './milestone'

export const handleIssueComment = async (
  context: Context = github.context
): Promise<void> => {
  const commandConfig = core
    .getInput('prow-commands', {required: false})
    .split(' ')
  const commentBody: string = context.payload['comment']['body']

  await Promise.all(
    commandConfig.map(async command => {
      if (commentBody.includes(command)) {
        switch (command) {
          case '/assign':
            await assign(context)
            break

          case '/cc':
            await cc(context)
            break

          case '/uncc':
            await uncc(context)
            break

          case '/unassign':
            await unassign(context)
            break

          case '/approve':
            return await approve(context).catch(async e => {
              return e
            })

          case '/retitle':
            await retitle(context)
            break

          case '/remove':
            await remove(context)
            break

          case '/area':
            await area(context)
            break

          case '/kind':
            await kind(context)
            break

          case '/hold':
            return await hold(context).catch(async e => {
              return e
            })

          case '/priority':
            await priority(context)
            break

          case '/lgtm':
            await lgtm(context)
            break

          case '/close':
            await close(context)
            break

          case '/lock':
            await lock(context)
            break

          case '/reopen':
            await reopen(context)
            break

          case '/rerun':
            await rerun(context)
            break

          case '/milestone':
            await milestone(context)
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
      }
    })
  ).then(results => {
    for (const result of results) {
      if (result instanceof Error) {
        throw new Error(`error handling issue comment: ${result}`)
      }
    }
  })
}
