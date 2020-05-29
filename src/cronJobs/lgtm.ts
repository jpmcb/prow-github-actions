import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'

import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

let jobsDone = 0

// Inspired by the actions/stale repository
export const cronLgtm = async (
  currentPage: number,
  context: Context
): Promise<number> => {
  core.info(`starting lgtm merger!`)
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)

  // Get next batch
  let prs: Octokit.PullsListResponseItem[]
  try {
    prs = await getPrs(octokit, context, currentPage)
  } catch (e) {
    throw new Error(`could not get PRs: ${e}`)
  }

  if (prs.length <= 0) {
    // All done!
    return jobsDone
  }

  await Promise.all(
    prs.map(async pr => {
      core.info(`processing pr: ${pr.number}`)
      if (pr.state === 'closed') {
        return
      }

      if (pr.state === 'locked') {
        return
      }

      return await tryMergePr(pr, octokit, context)
        .then(() => {
          jobsDone++
        })
        .catch(async e => {
          return e
        })
    })
  ).then(results => {
    for (const result of results) {
      if (result instanceof Error) {
        throw new Error(`error processing pr: ${result}`)
      }
    }
  })

  // Recurse, continue to next page
  return await cronLgtm(currentPage + 1, context)
}

// grab issues from github in baches of 100
const getPrs = async (
  octokit: github.GitHub,
  context: Context = github.context,
  page: number
): Promise<Octokit.PullsListResponse> => {
  core.info(`getting prs page ${page}...`)

  const prResults = await octokit.pulls.list({
    ...context.repo,
    state: 'open',
    page
  })

  core.info(`got: ${prResults.data}`)

  return prResults.data
}

const tryMergePr = async (
  pr: Octokit.PullsListResponseItem,
  octokit: github.GitHub,
  context: Context = github.context
): Promise<void> => {
  // if pr has label 'lgtm', attempt to merge
  if (
    pr.labels.map(e => e.name).includes('lgtm') &&
    !pr.labels.map(e => e.name).includes('hold')
  ) {
    try {
      await octokit.pulls.merge({
        ...context.repo,
        pull_number: pr.number
      })
    } catch (e) {
      core.debug(`could not merge pr ${pr.number}: ${e}`)
    }
  }
}
