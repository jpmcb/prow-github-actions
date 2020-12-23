# Automatic PR merging

Prow github actions supports automatic PR merging through
[Github actions cron jobs](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#onschedule).

```yaml
name: "Merge on lgtm label"
on:
  schedule:
  - cron: "0 * * * *"

jobs:
  execute:
    runs-on: ubuntu-latest
    steps:
      - uses: jpmcb/prow-github-actions@v1
        with:
          jobs: 'lgtm'
          github-token: "${{ secrets.GITHUB_TOKEN }}"

          # this configuration is optional and will default to 'merge'
          # possible options are 'merge', 'rebase', or 'squash'
          merge-method: 'squash'
```
This Github workflow will check every hour
for PRs with the `lgtm` label and will attempt to automatically merge them.
If the `hold` label is present, it will block automatic merging.

The following workflow is meant to run on PR update / creation and integrates into the `lgtm` family of jobs.
```yaml
name: "Run Jobs on PR"
on: pull_request

jobs:
  execute:
    runs-on: ubuntu-latest
    steps:
      - uses: jpmcb/prow-github-actions@v1
        with:
          jobs: 'lgtm'
          github-token: "${{ secrets.GITHUB_TOKEN }}"
```
This workflow will remove the `lgtm` label from a PR that gets updated.
This prevents any un-reviewed code from being automatically merged by the lgtm-merger mechanism.

Refer to the [lgtm command](./commands.md) and the [PR jobs](./pr-jobs.md) for further reference.

## Known limitations
This job pulls PRs from github in batches of 100. This _may_ trigger a state
where github rate limits Prow github actions.
This may only happen with very large projects.
Please open an issue if you see this consistently happen.
