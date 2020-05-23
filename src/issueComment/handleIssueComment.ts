import * as core from '@actions/core'
import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'

import {assign} from './assign'
import {unassign} from './unassign'
import {approve} from './approve'
import {cancel} from './cancel'
import {retitle} from './retitle'
import {remove} from '../labels/remove'
import {area} from '../labels/area'
import {kind} from '../labels/kind'
import {priority} from '../labels/priority'

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

          case '/unassign':
            await unassign(context)
            break

          case '/approve':
            await approve(context)
            break

          case '/cancel':
            await cancel(context)
            break

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

          case '/priority':
            await priority(context)
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
  )
}
