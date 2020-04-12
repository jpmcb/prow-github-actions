import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
  
    const token = core.getInput("github-token");
    const command = core.getInput("command", { required: true })
    
    core.debug(`command: ${command}`)

    const issueNumber: number | undefined = github.context.payload.issue?.number
    const commentBody: string = github.context.payload["comment"]["body"]
    const commenterId: string = github.context.payload["user"]["id"]

    if (commentBody.includes(command)) {
      const octokit = new github.GitHub(token)

      await octokit.issues.addAssignees({
        ...github.context.repo!,
        'issue_number': issueNumber!,
        'assignees': [commenterId]
      })
    }

  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
