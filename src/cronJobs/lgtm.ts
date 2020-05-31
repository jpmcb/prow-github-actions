import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'

import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

let jobsDone = 0

/**
 * Inspired by https://github.com/actions/stale
 * this will recurse through the pages of PRs for a repo
 * and attempt to merge them if they have the "lgtm" label
 *
 * @param currentPage - the page to return from the github api
 * @param context - The github actions event context
 */
export const cronLgtm = async (
  currentPage: number,
  context: Context
): Promise<number> => {
  core.info(`starting lgtm merger page: ${currentPage}`)
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)

  // Get next batch
  let prs: Octokit.PullsListResponseItem[]
  try {
    prs = await getOpenPrs(octokit, context, currentPage)
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

/**
 * grabs pulls from github in baches of 100
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions workflow context
 * @param page - the page number to get from the api
 */
const getOpenPrs = async (
  octokit: github.GitHub,
  context: Context = github.context,
  page: number
): Promise<Octokit.PullsListResponse> => {
  core.debug(`getting prs page ${page}...`)

  const prResults = await octokit.pulls.list({
    ...context.repo,
    state: 'open',
    page
  })

  core.debug(`got: ${prResults.data}`)

  return prResults.data
}

/**
 * Attempts to merge a PR if it is mergable and has the lgtm label
 *
 * @param pr - the PR to try and merge
 * @param octokit - a hydrated github api client
 * @param context - the github actions event context
 */
const tryMergePr = async (
  pr: Octokit.PullsListResponseItem,
  octokit: github.GitHub,
  context: Context = github.context
): Promise<void> => {
  // if pr has label 'lgtm', attempt to merge
  // but not if it has the 'hold' label
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
