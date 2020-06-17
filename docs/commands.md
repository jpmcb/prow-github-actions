# Prow github actions commands

Commands | Policy | Description
--- | --- | ---
`/approve` | Org members & Collaborators | approve all the files for the current PR
`/approve cancel` | Org member & Collaborators | removes your approval on this pull-request
`/assign [@userA @userB @etc]` | anyone | Assign other users (or yourself if no one is specified). Target user must be Org Member, Collaborator, or have previously commented
`/unassign [@userA @userB @etc]` | anyone | Unassigns specified people (or yourself if no one is specified). Target must have been already assigned.
`/cc [@userA @userB @etc]` | anyone | Request review from specified people (or yourself if no one is specified). Target be an Org Member, Collaborator, or have previously commented.
`/uncc [@userA @userB @etc]` | anyone | Dismiss review request for specified people (or yourself if no one is specified). Target must already have had a review requested.
`/close` | Collaborators | closes the issue / PR
`/reopen` | Collaborators | reopens a closed issue / PR
`/lock [resolved | off-topic | too-heated | spam]` | Collaborators | locks the issue / PR with the specified reason
`/milestone milestone-name` | Collaborators | Adds issue / PR to an existing milestone
`/retitle some new title` | Collaborators | Renames the issue / PR


Label Commands | Policy | Description
--- | --- | ---
`/area [label1 label2 ...]` | anyone | adds an area/<> label(s) if it's defined in [the `.github/labels.yaml` file](./labeling.md)
`/kind [label1 label2 ...]` | anyone | adds a kind/<> label(s) if it's defined in [the `.github/labels.yaml` file](./labeling.md)
`/lgtm` | Collaborators and Org Members | adds the `lgtm` label. This is used for [automatic PR merging]()
`/lgtm cancel` | prow [lgtm](./prow/plugins/lgtm) | authors and assignees | removes the `lgtm` label
`/hold` | anyone | adds the `hold` label which prevents [automatic PR merging]()
`/hold cancel` | anyone | removes the `hold` label
`/priority [label1 label2 ...]` | anyone | adds a priority/<> label(s) if it's defined in [the `.github/labels.yaml` file](./automatic-merging.md)
`/remove [label1 label2 ...]` | Collaborators | removes a specified label(s) on an issue / PR
