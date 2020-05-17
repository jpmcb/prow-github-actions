import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'

import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

import * as yaml from 'js-yaml'
import * as minimatch from 'minimatch'

let jobsDone = 0

// Inspired by the actions/stale repository
export const cronLabelPr = async (
  currentPage: number,
  context: Context
): Promise<number> => {
  core.info(`starting PR labeler!`)
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)

  // Get next batch
  const prs = await getPrs(octokit, context, currentPage)

  if (prs.length <= 0) {
    // All done!
    return jobsDone
  }

  await Promise.all(
    prs.map(async pr => {
      core.info(`processing pr: ${pr.id}`)
      if (pr.state === 'closed') {
        return
      }

      if (pr.state === 'locked') {
        return
      }

      await labelPr(pr.id, context, octokit)
      jobsDone++
    })
  )

  // Recurse, continue to next page
  return cronLabelPr(currentPage + 1, context)
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
    page
  })

  core.info(`got: ${prResults.data}`)

  return prResults.data
}

/**
 * Inspired by https://github.com/actions/labeler
 *    - Uses js-yaml to load labeler.yaml
 *    - Uses Minimatch to match globs to changed files
 * @param context - the Github context for pull req event
 */
export const labelPr = async (
  prNum: number,
  context: Context = github.context,
  octokit: github.GitHub
): Promise<void> => {
  const changedFiles = await getChangedFiles(octokit, context, prNum)
  const labels = await getLabelsFromFileGlobs(octokit, context, changedFiles)

  if (labels.length === 0) {
    core.info('pr-labeler: no labels matched file globs')
  }

  await sendLabels(octokit, context, prNum, labels)
}

const getChangedFiles = async (
  octokit: github.GitHub,
  context: Context,
  prNum: number
): Promise<string[]> => {
  core.info(`getting changed files for pr ${prNum}`)
  const listFilesResponse = await octokit.pulls.listFiles({
    ...context.repo,
    pull_number: prNum
  })

  const changedFiles = listFilesResponse.data.map(f => f.filename)

  return changedFiles
}

const getLabelsFromFileGlobs = async (
  octokit: github.GitHub,
  context: Context,
  files: string[]
): Promise<string[]> => {
  const toReturn: string[] = []

  core.info(`getting labels.yaml file`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await octokit.repos.getContents({
    ...context.repo,
    path: '.github/labels.yaml'
  })

  if (!response.data.content || !response.data.encoding) {
    throw new Error(
      `area: error parsing data from content response: ${response.data}`
    )
  }

  const decoded = Buffer.from(
    response.data.content,
    response.data.encoding
  ).toString()

  const content = yaml.safeLoad(decoded)

  const labelMap: Map<string, string[]> = new Map()

  for (const label in content) {
    if (typeof content[label] === 'string') {
      labelMap.set(label, [content[label]])
    } else if (content[label] instanceof Array) {
      labelMap.set(label, content[label])
    } else {
      throw Error(
        `pr-labeler: found unexpected type for label ${label} (should be string or array of globs)`
      )
    }
  }

  for (const [label, globs] of labelMap.entries()) {
    if (checkGlobs(files, globs)) {
      toReturn.push(label)
    }
  }

  return toReturn
}

const checkGlobs = (files: string[], globs: string[]): boolean => {
  for (const glob of globs) {
    const matcher = new minimatch.Minimatch(glob)
    for (const file of files) {
      if (matcher.match(file)) {
        return true
      }
    }
  }
  return false
}

export const sendLabels = async (
  octokit: github.GitHub,
  context: Context,
  prNum: number,
  labels: string[]
): Promise<void> => {
  try {
    core.info(`sending labels ${labels}`)
    await octokit.issues.addLabels({
      ...context.repo,
      issue_number: prNum,
      labels
    })
  } catch (e) {
    throw new Error(`pr-labeler: ${e}`)
  }
}
