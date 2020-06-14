# Automatic PR labeling

Prow Github actions supports automatic labeling of PRs through Github cron jobs

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
This job will run every hour from the master branch.
It will inspect the `.github/labels.yaml` file for file globs
and appropriately label the PR based on changed files.

For example, if `.github/labels.yaml` contains:
```yaml
source:
  - 'src/**'
```
and a PR has changed the file `src/some/sourcefile.js`,
the `pr-labeler` job will label the pr with `source`.

Refer to [the labeling docs](./labeling.md) for more information.
