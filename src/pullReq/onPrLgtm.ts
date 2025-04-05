import type { Context } from '@actions/github/lib/context'

import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import { getCurrentLabels, removeLabels } from '../utils/labeling'

/**
 * Removes the 'lgtm' label after a pull request event
 *
 * @param context - The github actions event context
 */
export async function onPrLgtm(context: Context): Promise<void> {
  const token = core.getInput('github-token', { required: true })
  const octokit = new Octokit({
    auth: token,
  })

  const prNumber: number | undefined = context.payload.pull_request?.number

  if (prNumber === undefined) {
    throw new Error(
      `github context payload missing pr number: ${context.payload}`,
    )
  }

  let currentLabels: string[] = []
  try {
    currentLabels = await getCurrentLabels(octokit, context, prNumber)
    core.debug(`remove-lgtm: found labels for issue ${currentLabels}`)
  }
  catch (e) {
    throw new Error(`could not get labels from issue: ${e}`)
  }

  if (currentLabels.includes('lgtm')) {
    await removeLabels(octokit, context, prNumber, ['lgtm'])
  }
}
