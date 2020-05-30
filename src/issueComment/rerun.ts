import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'

import * as core from '@actions/core'

import {getLineArgs} from '../utils/command'

export const rerun = async (
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

  const actionToRun: string = getLineArgs('/rerun', commentBody)

  if (actionToRun === '') {
    throw new Error(`please provide an action to rerun`)
  }

  const actions = await octokit.actions.listRepoWorkflows({
    ...context.repo
  })

  for (const workflow of actions.data.workflows) {
    if (workflow.name === actionToRun) {
      core.debug(`context ref: ${context.ref}`)

      const runs = await octokit.actions.listWorkflowRuns({
        ...context.repo,
        workflow_id: workflow.id,
        event: 'pull_request'
      })

      core.debug(`runs: ${runs.data.workflow_runs}`)
      if (runs.data.workflow_runs.length === 0) {
        return
      }

      await octokit.actions.reRunWorkflow({
        ...context.repo,
        run_id: runs.data.workflow_runs[0].id
      })

      return
    }
  }
}
