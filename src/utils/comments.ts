import {Octokit} from '@octokit/rest'
import {Context} from '@actions/github/lib/context'

/**
 * createComment comments on the specified issue or pull request
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param issueNum - the issue associated with this runtime
 * @param message - the comment message body
 */
export const createComment = async (
  octokit: Octokit,
  context: Context,
  issueNum: number,
  message: string
): Promise<void> => {
  try {
    /* eslint-disable @typescript-eslint/naming-convention */
    await octokit.issues.createComment({
      ...context.repo,
      issue_number: issueNum,
      body: message
    })
    /* eslint-enable @typescript-eslint/naming-convention */
  } catch (e) {
    throw new Error(`could not add comment: ${e}`)
  }
}
