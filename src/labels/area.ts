import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'
import * as yaml from 'js-yaml'

import {getCommandArgs} from '../utils/command'

export const area = async (
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

  let commentArgs: string[] = getCommandArgs('/area', commentBody)

  const areaLabels = await getAreaLabels(octokit, context)
  core.info(`area: found labels ${areaLabels}`)

  commentArgs = commentArgs.filter(e => {
    return areaLabels.includes(e)
  })

  commentArgs = addAreaPrefix(commentArgs)

  // no arguments after command provided
  if (commentArgs.length === 0) {
    throw new Error(`area: command args missing from body`)
  }

  labelIssue(octokit, context, issueNumber, commentArgs)
}

const addAreaPrefix = (args: string[]): string[] => {
  const toReturn: string[] = []

  for (const arg of args) {
    toReturn.push(`area/${arg}`)
  }

  return toReturn
}

// This method has some eslint ignores related to
// no explicit typing in octokit for content response - https://github.com/octokit/rest.js/issues/1516
const getAreaLabels = async (
  octokit: github.GitHub,
  context: Context
): Promise<string[]> => {
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

  if (!content['area'] && !(content['area'] instanceof Array)) {
    throw new Error(`area: yaml malformed, expected 'area' top level key`)
  }

  return content['area']
}

export const labelIssue = async (
  octokit: github.GitHub,
  context: Context,
  issueNum: number,
  labels: string[]
): Promise<void> => {
  try {
    await octokit.issues.addLabels({
      ...context.repo,
      issue_number: issueNum,
      labels
    })
  } catch (e) {
    throw new Error(`area: ${e}`)
  }
}
