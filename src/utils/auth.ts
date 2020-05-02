import * as github from '@actions/github'

import {Context} from '@actions/github/lib/context'

export const checkOrgMember = async (
  octokit: github.GitHub,
  context: Context,
  user: string
): Promise<boolean> => {
  try {
    if (context.payload.repository === undefined) {
      // TODO - repository is broken, error message?
      return false
    }

    await octokit.orgs.checkMembership({
      org: context.payload.repository.owner.login,
      username: user
    })

    return true
  } catch (e) {
    return false
  }
}

export const checkCollaborator = async (
  octokit: github.GitHub,
  context: Context,
  user: string
): Promise<boolean> => {
  try {
    await octokit.repos.checkCollaborator({
      ...context.repo,
      username: user
    })

    return true
  } catch (e) {
    return false
  }
}

// will this just always be true ...? Should it not check the last one where they've ... commented?
export const checkIssueComments = async (
  octokit: github.GitHub,
  context: Context,
  issueNum: number,
  user: string
): Promise<boolean> => {
  try {
    const comments = await octokit.issues.listComments({
      ...context.repo,
      issue_number: issueNum
    })

    for (const e of comments.data) {
      if (e.user.login === user) {
        return true
      }
    }

    return false
  } catch (e) {
    return false
  }
}

export const checkAssignee = async (
  octokit: github.GitHub,
  context: Context,
  issueNum: number,
  user: string
): Promise<boolean> => {
  try {
    const assignees = await octokit.issues.listAssignees({
      ...context.repo
    })

    for (const a of assignees.data) {
      if (a.login === user) {
        return true
      }
    }

    return false
  } catch (e) {
    return false
  }
}
