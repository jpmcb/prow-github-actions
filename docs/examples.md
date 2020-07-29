# Examples

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
tests:
  - '**/*.test.ts'

source:
  - 'src/**'
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

### PR Labeler
```yaml
name: "Label PRs from globs"
on:
  schedule:
  - cron: "0 * * * *"

jobs:
  execute:
    runs-on: ubuntu-latest
    steps:
      - uses: jpmcb/prow-github-actions@v1
        with:
          jobs: 'pr-labeler'
          github-token: "${{ secrets.GITHUB_TOKEN }}"
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

#### PR job to remove lgtm label on update
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
