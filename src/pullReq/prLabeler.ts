import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

import * as yaml from 'js-yaml'
import * as minimatch from 'minimatch'

export const labelPr = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)

  const prNumber: number | undefined = context.payload.pull_request?.number

  if (prNumber === undefined) {
    // TODO - Bail, issue number not defined :(
    //    want some error messaging here?
    return
  }

  const changedFiles = await getChangedFiles(octokit, context, prNumber)
  const labels = await getLabelsFromFileGlobs(octokit, context, changedFiles)

  // no arguments after command provided
  if (labels.length === 0) {
    core.info('pr-labeler: no labels matched file globs')
  }

  await sendLabels(octokit, context, prNumber, labels)
}

const getChangedFiles = async (
  octokit: github.GitHub,
  context: Context,
  prNum: number
): Promise<string[]> => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await octokit.repos.getContents({
    ...context.repo,
    path: '.github/labels.yaml'
  })

  if (!response.data.content || !response.data.encoding) {
    // TODO error state we have no content
    throw new Error(`area: error parsing data from content response`)
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

function checkGlobs(files: string[], globs: string[]): boolean {
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
    await octokit.issues.addLabels({
      ...context.repo,
      issue_number: prNum,
      labels
    })
  } catch (e) {
    throw new Error(`pr-labeler: ${e}`)
  }
}
