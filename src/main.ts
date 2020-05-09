// Test for PR labeler

import * as core from '@actions/core'
import * as github from '@actions/github'
import {handleIssueComment} from './issueComment/handleIssueComment'
import {handlePullReq} from './pullReq/handlePullReq'

async function run(): Promise<void> {
  try {
    switch (github.context.eventName) {
      case 'issue_comment':
        handleIssueComment()
        break

      case 'pull_request':
        handlePullReq()
        break

      default:
        core.error(`${github.context.eventName} not yet supported`)
        break
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
