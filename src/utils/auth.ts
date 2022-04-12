import * as github from '@actions/github'
import * as core from '@actions/core'

import {Context} from '@actions/github/lib/context'

import fs from 'fs'
import yaml from 'js-yaml'
import { env } from 'process'

/**
 * checkOrgMember will check to see if the given user is a repo org member
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param user - the users to check auth on
 */
export const checkOrgMember = async (
  octokit: github.GitHub,
  context: Context,
  user: string
): Promise<boolean> => {
  try {
    if (context.payload.repository === undefined) {
      core.debug(`checkOrgMember error: context payload repository undefined`)
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

/**
 * checkCollaborator checks to see if the given user is a repo collaborator
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param user - the users to check auth on
 */
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

/**
 * checkIssueComments will check to see if the given user
 * has commented on the given issue
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param issueNum - the issue or pr number this runtime is associated with
 * @param user - the users to check auth on
 */
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

/**
 * getOrgCollabCommentUsers will return an array of users who are org members,
 * repo collaborators, or have commented previously
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param issueNum - the issue or pr number this runtime is associated with
 * @param args - the users to check auth on
 */
export const getOrgCollabCommentUsers = async (
  octokit: github.GitHub,
  context: Context,
  issueNum: number,
  args: string[]
): Promise<string[]> => {
  const toReturn: string[] = []

  try {
    await Promise.all(
      args.map(async arg => {
        const isOrgMember = await checkOrgMember(octokit, context, arg)
        const isCollaborator = await checkCollaborator(octokit, context, arg)
        const hasCommented = await checkIssueComments(
          octokit,
          context,
          issueNum,
          arg
        )

        if (isOrgMember || isCollaborator || hasCommented) {
          toReturn.push(arg)
        }
      })
    )
  } catch (e) {
    throw new Error(`could not get authorized user: ${e}`)
  }

  return toReturn
}

/**
 * checkCommenterAuth will return true
 * if the user is a org member, a collaborator, or has commented previously
 *
 * @param octokit - a hydrated github client
 * @param context - the github actions event context
 * @param issueNum - the issue or pr number this runtime is associated with
 * @param args - the users to check auth on
 */
export const checkCommenterAuth = async (
  octokit: github.GitHub,
  context: Context,
  issueNum: number,
  user: string
): Promise<Boolean> => {
  let isOrgMember: Boolean = false
  let isCollaborator: Boolean = false
  let hasCommented: Boolean = false

  try {
    isOrgMember = await checkOrgMember(octokit, context, user)
  } catch (e) {
    throw new Error(`error in checking org member: ${e}`)
  }

  try {
    isCollaborator = await checkCollaborator(octokit, context, user)
  } catch (e) {
    throw new Error(`could not check collaborator: ${e}`)
  }

  try {
    hasCommented = await checkIssueComments(octokit, context, issueNum, user)
  } catch (e) {
    throw new Error(`could not check issue comments: ${e}`)
  }

  if (isOrgMember || isCollaborator || hasCommented) {
    return true
  }

  return false
}

/**
 * When an OWNERS file is present, use it to authorize the action
   otherwise fall back to allowing organization members and collaborators
 * @param role is the role to check
 * @param username is the user to authorize
 */
export const assertAuthorizedByOwnersOrMembership = async(
  octokit: github.GitHub,
  context: Context,
  role: string,
  username: string) => {
    core.debug('Checking if the user is authorized to interact with prow')
  if (hasOwners()) {
    if (!isInOwners(role, username)) {
      throw new Error(
        `user not included in the `+role+` role in the OWNERS file`
      )
    }
  } else {
    const isOrgMember = await checkOrgMember(octokit, context, username)
    const isCollaborator = await checkCollaborator(octokit, context, username)

    if (!isOrgMember && !isCollaborator) {
      throw new Error(
        `user is not a org member or collaborator`
      )
    }
  }
}

/**
 * Check if an OWNERS file exists
 */
function hasOwners(): boolean {
  const ownersPath = getOwnersPath()
  core.debug(`Looking for an OWNERS file in ${ownersPath}`)
  
  if (fs.existsSync(ownersPath)) {
    core.debug('Using the OWNERS file to authorize the command')
    return true
  }

  core.debug('No OWNERS file found')
  return false
}

/**
 * Gets the possible path to an OWNERS file.
 * Uses GITHUB_WORKSPACE environment variable if set, otherwise
 * uses the working directory.
 * @param role - the role to check
 * @param username - the user to authorize
 */
export function getOwnersPath(): string {
  var workspace = process.env.GITHUB_WORKSPACE
  if (workspace?.length == 0) {
    workspace = "."
  }
  return workspace + "/OWNERS"
}

/**
 * Determine if the user has the specified role in the OWNERS file.
 * @param role - the role to check
 * @param username - the user to authorize
 */
function isInOwners(role: string, username: string): boolean {
  core.debug(`checking if ${username} is in the ${role} in the OWNERS file`)
  var ownersContents = fs.readFileSync(getOwnersPath(), "utf8");
  var ownersData = yaml.safeLoad(ownersContents);

  var roleMembers = ownersData[role];
  if ((roleMembers as Array<string>) != undefined){
    return roleMembers.indexOf(username) > -1;
  }

  core.info(`${username} is not in the ${role} role in the OWNERS file`)
  return false;
}