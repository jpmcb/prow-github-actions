# Prow github actions commands

Commands | Policy | Description
--- | --- | ---
`/approve` | [OWNERS](#owners) if present, otherwise Org members & Collaborators | approve all the files for the current PR
`/approve cancel` | [OWNERS](#owners) if present, otherwise Org member & Collaborators | removes your approval on this pull-request
`/assign [@userA @userB @etc]` | anyone | Assign other users (or yourself if no one is specified). Target user must be Org Member, Collaborator, or have previously commented
`/unassign [@userA @userB @etc]` | anyone | Unassigns specified people (or yourself if no one is specified). Target must have been already assigned.
`/cc [@userA @userB @etc]` | anyone | Request review from specified people (or yourself if no one is specified). Target be an Org Member, Collaborator, or have previously commented.
`/uncc [@userA @userB @etc]` | anyone | Dismiss review request for specified people (or yourself if no one is specified). Target must already have had a review requested.
`/close` | Collaborators | closes the issue / PR
`/reopen` | Collaborators | reopens a closed issue / PR
`/lock [resolved / off-topic / too-heated / spam]` | Collaborators | locks the issue / PR with the specified reason
`/milestone milestone-name` | Collaborators | Adds issue / PR to an existing milestone
`/retitle some new title` | Collaborators | Renames the issue / PR


Label Commands | Policy | Description
--- | --- | ---
`/area [label1 label2 ...]` | anyone | adds an area/<> label(s) if it's defined in [the `.github/labels.yaml` file](./labeling.md)
`/kind [label1 label2 ...]` | anyone | adds a kind/<> label(s) if it's defined in [the `.github/labels.yaml` file](./labeling.md)
`/lgtm` | [OWNERS](#owners) if present, otherwise Collaborators and Org Members | adds the `lgtm` label. This is used for [automatic PR merging]()
`/lgtm cancel` | [OWNERS](#owners) if present, otherwise Collaborators and Org Members | removes the `lgtm` label
`/hold` | anyone | adds the `hold` label which prevents [automatic PR merging](./automatic-merging.md). Also see [lgtm removal on pr update](./pr-jobs.md)
`/hold cancel` | anyone | removes the `hold` label
`/priority [label1 label2 ...]` | anyone | adds a priority/<> label(s) if it's defined in [the `.github/labels.yaml` file](./automatic-merging.md)
`/remove [label1 label2 ...]` | Collaborators | removes a specified label(s) on an issue / PR

## OWNERS

A simplified version of [Prow's OWNERS](https://go.k8s.io/owners) file is supported. When an OWNERS file is present at the root of the repository, it is used to authorize the /lgtm and /approve commands. The prow action requires that the repository has already been cloned into the working directory. See an [example][owners-example] of how to clone the repository before running the Prow action.

The `reviewers` role grants access to the /lgtm command and the approvers role grants access to the /approve command.

The `approvers` role does not grant the reviewers role, a user must be in both roles to use /lgtm and /approve.

The OWNERS file must be in YAML format. All entries are expected to be GitHub usernames; teams are not supported.

```yaml
# List of usernames who may use /lgtm
reviewers:
- user1
- user2
- user3

# List of usernames who may use /approve
approvers:
- user1
- user2
- admin1
```

[owners-example]: ./examples.md#owners
