# Prow Github Actions ⛵️

This project is inspired by [Prow](https://github.com/kubernetes/test-infra/tree/master/prow) and brings it's chat-ops functionality and project management to a simple, Github actions workflow.

> Prow is a Kubernetes based CI/CD system ... and provides GitHub automation in the form of policy enforcement, chat-ops via /foo style commands, and automatic PR merging.

## Quickstart

Check out the _"EXAMPLE"_ issues and pull requests (open and closed) in this repo to see how this works!

---
Run specified actions or jobs for issue and PR comments through a `workflow.yaml` file:
```yaml
name: "Prow github actions"
on:
  issue_comment:
    types: [created]

jobs:
  execute:
    runs-on: ubuntu-latest
    steps:
      - uses: jpmcb/prow-github-actions
        with:
          prow-commands: '/assign 
            /unassign 
            /approve 
            /retitle 
            /area 
            /kind 
            /priority 
            /remove 
            /lgtm 
            /close 
            /reopen 
            /lock 
            /milestone 
            /hold 
            /cc 
            /uncc'
          github-token: "${{ secrets.GITHUB_TOKEN }}"
```

Automatically label PRs every hour based on your `.github/labels.yaml`:
```yaml
name: "Label PRs from globs"
on:
  schedule:
  - cron: "0 * * * *"

jobs:
  execute:
    runs-on: ubuntu-latest
    steps:
      - uses: jpmcb/prow-github-actions
        with:
          jobs: 'pr-labeler'
          github-token: "${{ secrets.GITHUB_TOKEN }}"
```

Your `.github/labels.yaml` may look like:
```yaml
# labels to be used with /area command
area:
  - 'bug'
  - 'important'

# File globs for PR labeler
tests:
  - '**/*.test.ts'
```

You can automatically merge PRs based on a cron schedule if it contains the `lgtm` label:
```yaml
name: "Merge on lgtm label"
on:
  schedule:
  - cron: "0 * * * *"

jobs:
  execute:
    runs-on: ubuntu-latest
    steps:
      - uses: jpmcb/prow-github-actions
        with:
          jobs: 'lgtm'
          merge-method: merge
          github-token: "${{ secrets.GITHUB_TOKEN }}"
```

## Documentation
- [Overview](./docs/overview.md)
- [Commands](./docs/commands.md)
- [Labeling](./docs/labeling.md)
- [PR Labeling](./docs/pr-labeling.md)
- [Cron Jobs](./docs/cron-jobs.md)
- [Automatic PR merging](./docs/automatic-merging.md)
- [Examples](./docs/examples.md)
- [Contributing](./docs/contributing.md)

---
_open water breeze  
the ocean seas are endless  
forward to the prow_
