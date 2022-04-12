# Examples

* [.github/labels.yaml](#githublabelsyaml)
* [OWNERS](#owners)
* [All prow github actions](#all-prow-github-actions)
* [PR Labeler](#pr-labeler)
* [Automatic PR merger](#automatic-pr-merger)
* [PR job to remove lgtm label on update](#pr-job-to-remove-lgtm-label-on-update)

### .github/labels.yaml
A `.github/labels.yaml` file is necessary for most of the labeling commands & jobs

```yaml
area:
  - 'bug'
  - 'important'

kind:
  - 'failing-test'
  - 'cleanup'

priority:
  - 'low'
  - 'mid'
  - 'high'

# File globs for PR labeler
# refer to github actions/labeler for further documentation
tests:
  - '**/*.test.ts'

source:
  - 'src/**'
```

### OWNERS

Below is an example of how to use an [OWNERS](./commands.md#owners) file with the Prow action.

```yaml
name: "Handle prow slash commands"
on:
  issue_comment:
    types: [created]

# Grant additional permissions to the GITHUB_TOKEN
permissions:
  # Allow labeling issues
  issues: write
  # Allow adding a review to a pull request
  pull-requests: write

jobs:
  execute:
    runs-on: ubuntu-latest
    steps:
      # Clone the repository so that the OWNERS file can be used by prow
      - run: hub clone ${{ github.server_url }}/${{ github.repository }} .
      - uses: jpmcb/prow-github-actions@v1
        with:
          prow-commands: |
            /approve
            /lgtm
          github-token: "${{ secrets.GITHUB_TOKEN }}"
```


### All prow github actions

```yaml
name: "Prow github actions"
on:
  issue_comment:
    types: [created]

jobs:
  execute:
    runs-on: ubuntu-latest
    steps:
      - uses: jpmcb/prow-github-actions@v1
        with:
          prow-commands: |
            /assign
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
            /uncc
          github-token: "${{ secrets.GITHUB_TOKEN }}"
```

### PR Labeler
Use the Github actions/labeler which now supports `pull_request_target`
```yaml
name: "Pull Request Labeler"
on:
- pull_request_target

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/labeler@main
      with:
        repo-token: "${{ secrets.GITHUB_TOKEN }}"
```

### Automatic PR merger
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
```

### PR job to remove lgtm label on update
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
