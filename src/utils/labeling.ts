import {Octokit} from '@octokit/rest'
import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

import * as yaml from 'js-yaml'

/**
 * getArgumentLabels will get the .github/labels.yaml or .github.labels.yml file.
 * it will then return the section specified by arg.
 *
 * This method has some eslint ignores related to
 * no explicit typing in octokit for content response - https://github.com/octokit/rest.js/issues/1516
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param arg - the label section to return. For example, may be 'area', etc
 */
export const getArgumentLabels = async (
  octokit: Octokit,
  context: Context,
  arg: string
): Promise<string[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: any = undefined
  try {
    response = await octokit.repos.getContent({
      ...context.repo,
      path: '.github/labels.yaml'
    })
  } catch (e) {
    try {
      response = await octokit.repos.getContent({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any = yaml.load(decoded)

  if (!content[arg] && !(content[arg] instanceof Array)) {
    throw new Error(`${arg}: yaml malformed, expected '${arg}' top level key`)
  }

  return content[arg]
}

/**
 * labelIssue will label the issue with the labels provided
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param issueNum - the issue associated with this runtime
 * @param labels - the labels to add to the issue
 */
export const labelIssue = async (
  octokit: Octokit,
  context: Context,
  issueNum: number,
  labels: string[]
): Promise<void> => {
  try {
    /* eslint-disable @typescript-eslint/naming-convention */
    await octokit.issues.addLabels({
      ...context.repo,
      issue_number: issueNum,
      labels
    })
    /* eslint-enable @typescript-eslint/naming-convention */
  } catch (e) {
    throw new Error(`could not add labels: ${e}`)
  }
}

/**
 * getCurrentLabels will return the labels for the associated issue
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param issueNum - the issue associated with this runtime
 */
export const getCurrentLabels = async (
  octokit: Octokit,
  context: Context,
  issueNum: number
): Promise<string[]> => {
  try {
    /* eslint-disable @typescript-eslint/naming-convention */
    const issue = await octokit.issues.get({
      ...context.repo,
      issue_number: issueNum
    })
    /* eslint-enable @typescript-eslint/naming-convention */

    return issue.data.labels.map((e): string => {
      if (typeof e == 'object') {
        return e.name || ''
      }
      return e
    })
  } catch (e) {
    throw new Error(`could not get issue: ${e}`)
  }
}

/**
 * removeLabels will remove labels for the issue with the labels provided
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param issueNum - the issue associated with this runtime
 * @param labels - the labels to remove from the issue
 */
export const removeLabels = async (
  octokit: Octokit,
  context: Context,
  issueNum: number,
  labels: string[]
): Promise<void> => {
  for (const label of labels) {
    try {
      /* eslint-disable @typescript-eslint/naming-convention */
      await octokit.issues.removeLabel({
        ...context.repo,
        issue_number: issueNum,
        name: label
      })
      /* eslint-enable @typescript-eslint/naming-convention */
    } catch (e) {
      core.debug(`could not remove labels: ${e}`)
    }
  }
}

/**
 * addPrefix will add the associated prefix to the arguments array
 *
 * @param prefix - the prefix to add to the args
 * @param args - the strings to add the prefix to
 */
export const addPrefix = (prefix: string, args: string[]): string[] => {
  const toReturn: string[] = []

  for (const arg of args) {
    toReturn.push(`${prefix}/${arg}`)
  }

  return toReturn
}

/**
 * cancelLabel will remove an associated label
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param issueNum - the issue associated with this runtime
 * @param labels - the label to remove from the issue
 */
export const cancelLabel = async (
  octokit: Octokit,
  context: Context,
  issueNum: number,
  label: string
): Promise<void> => {
  let currentLabels: string[] = []
  try {
    currentLabels = await getCurrentLabels(octokit, context, issueNum)
    core.debug(`remove: found labels for issue ${currentLabels}`)
  } catch (e) {
    throw new Error(`could not get labels from issue: ${e}`)
  }

  if (currentLabels.includes(label)) {
    try {
      await removeLabels(octokit, context, issueNum, [label])
    } catch (e) {
      throw new Error(`could not remove ${label} label: ${e}`)
    }
  } else {
    core.debug(`could not find ${label} to remove`)
  }
}
