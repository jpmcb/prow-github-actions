import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

import {getCommandArgs} from '../utils/command'

export const area = async (
  context: Context = github.context
): Promise<void> => {
  const token = core.getInput('github-token', {required: true})
  const octokit = new github.GitHub(token)

  const issueNumber: number | undefined = context.payload.issue?.number
  const commentBody: string = context.payload['comment']['body']

  if (issueNumber === undefined) {
    // TODO - Bail, issue number not defined :(
    //    want some error messaging here?
    return
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

// -----------
// TODO - update / create labels if they don't exist yo!!

// This method has some eslint ignores related to
// no explicit typing in octokit for content response - https://github.com/octokit/rest.js/issues/1516
const getAreaLabels = async (
  octokit: github.GitHub,
  context: Context
): Promise<string[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await octokit.repos.getContents({
    ...context.repo,
    path: '.github/LABELS'
  })

  const toReturn: string[] = []
  if (!response.data.content || !response.data.encoding) {
    // TODO error state we have no content
    throw new Error(`area: error parsing data from content response`)
  }

  const line = Buffer.from(
    response.data.content,
    response.data.encoding
  ).toString()
  const lineArray = line.split('\n')

  let i = 0
  while (lineArray[i] !== 'area:' && i < lineArray.length) {
    i++
  }

  // advance the index to the next as we're at the 'area:'
  i++
  while (lineArray[i] !== '' && i < lineArray.length) {
    toReturn.push(lineArray[i])
    i++
  }

  return toReturn
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
