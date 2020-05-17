import * as github from '@actions/github'
import {Context} from '@actions/github/lib/context'

import * as yaml from 'js-yaml'

// This method has some eslint ignores related to
// no explicit typing in octokit for content response - https://github.com/octokit/rest.js/issues/1516
export const getArgumentLabels = async (
  arg: string,
  octokit: github.GitHub,
  context: Context
): Promise<string[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: any = undefined
  try {
    response = await octokit.repos.getContents({
      ...context.repo,
      path: '.github/labels.yaml'
    })
  } catch (e) {
    try {
      response = await octokit.repos.getContents({
        ...context.repo,
        path: '.github/labels.yml'
      })
    } catch (e2) {
      throw new Error(
        `could not get .github/labels.yaml or .github/labels.yml: ${e} ${e2}`
      )
    }
  }

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

  if (!content[arg] && !(content[arg] instanceof Array)) {
    throw new Error(`${arg}: yaml malformed, expected '${arg}' top level key`)
  }

  return content[arg]
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
    throw new Error(`could not add labels: ${e}`)
  }
}

export const addPrefix = (prefix: string, args: string[]): string[] => {
  const toReturn: string[] = []

  for (const arg of args) {
    toReturn.push(`${prefix}/${arg}`)
  }

  return toReturn
}
