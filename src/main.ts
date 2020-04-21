import * as core from '@actions/core'
import * as github from '@actions/github'
import {handleIssueComment} from './issueComment/handleIssueComment'

async function run(): Promise<void> {
  try {
    if (github.context.eventName == 'issue_comment') {
      handleIssueComment()
    } else {
      core.error(`${github.context.eventName} not yet supported`)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
