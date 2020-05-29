import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'

import * as core from '@actions/core'

import {getLineArgs} from '../utils/command'

export const milestone = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)

  const issueNumber: number | undefined = context.payload.issue?.number
  const commentBody: string = context.payload['comment']['body']

  if (issueNumber === undefined) {
    throw new Error(
      `github context payload missing issue number: ${context.payload}`
    )
  }

  const milestoneToAdd: string = getLineArgs('/milestone', commentBody)

  if (milestoneToAdd === '') {
    throw new Error(`please provide a milestone to add`)
  }

  const ms = await octokit.issues.listMilestonesForRepo({
    ...context.repo
  })

  for (const m of ms.data) {
    if (m.title === milestoneToAdd) {
      await octokit.issues.update({
        ...context.repo,
        issue_number: issueNumber,
        milestone: m.number
      })
    }
  }
}
