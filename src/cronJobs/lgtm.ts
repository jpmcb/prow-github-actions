import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'
import {Endpoints} from '@octokit/types'

import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

let jobsDone = 0

type PullsListResponseDataType =
  Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data']

type PullsListResponseItem = PullsListResponseDataType extends (infer Item)[]
  ? Item
  : never

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
  const octokit = new Octokit({
    auth: token
  })

  // Get next batch
  let prs: PullsListResponseDataType
  try {
    prs = await getOpenPrs(octokit, context, currentPage)
  } catch (e) {
    throw new Error(`could not get PRs: ${e}`)
  }

  if (prs.length <= 0) {
    // All done!
    return jobsDone
  }

  const results = await Promise.all(
    prs.map(async pr => {
      core.info(`processing pr: ${pr.number}`)
      if (pr.state === 'closed') {
        return
      }

      if (pr.state === 'locked') {
        return
      }

      try {
        await tryMergePr(pr, octokit, context)
        jobsDone++
      } catch (error) {
        return error
      }
    })
  )

  for (const result of results) {
    if (result instanceof Error) {
      throw new Error(`error processing pr: ${result}`)
    }
  }

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
  octokit: Octokit,
  context: Context = github.context,
  page: number
): Promise<PullsListResponseDataType> => {
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
  pr: PullsListResponseItem,
  octokit: Octokit,
  context: Context = github.context
): Promise<void> => {
  const method = core.getInput('merge-method', {required: false})

  // if pr has label 'lgtm', attempt to merge
  // but not if it has the 'hold' label
  if (
    pr.labels.map(e => e.name).includes('lgtm') &&
    !pr.labels.map(e => e.name).includes('hold')
  ) {
    try {
      switch (method) {
        case 'squash':
          /* eslint-disable @typescript-eslint/naming-convention */
          await octokit.pulls.merge({
            ...context.repo,
            pull_number: pr.number,
            merge_method: 'squash'
          })
          /* eslint-enable @typescript-eslint/naming-convention */
          break

        case 'rebase':
          /* eslint-disable @typescript-eslint/naming-convention */
          await octokit.pulls.merge({
            ...context.repo,
            pull_number: pr.number,
            merge_method: 'rebase'
          })
          /* eslint-enable @typescript-eslint/naming-convention */
          break

        default:
          /* eslint-disable @typescript-eslint/naming-convention */
          await octokit.pulls.merge({
            ...context.repo,
            pull_number: pr.number,
            merge_method: 'merge'
          })
        /* eslint-enable @typescript-eslint/naming-convention */
      }
    } catch (e) {
      core.debug(`could not merge pr ${pr.number}: ${e}`)
    }
  }
}
