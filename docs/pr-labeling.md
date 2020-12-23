# Automatic PR labeling

Prow Github actions _no longer supports_ automatic labeling of PRs through Github cron jobs.
Instead, use the Github actions/labeler action with the new `pull_request_target` action.

The labeler is documented [here](https://github.com/actions/labeler).

Refer to this thread and this comment for further discussion on the new action handler:
https://github.com/actions/labeler/issues/12#issuecomment-670967607

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
This job will run off of the _main_ branch and _not_ the PR'd code.
It will inspect the `.github/labels.yaml` file for file globs
and appropriately label the PR based on changed files.

For example, if `.github/labels.yaml` contains:
```yaml
source:
  - 'src/**'
```
and a PR has changed the file `src/some/sourcefile.js`,
the job will label the pr with `source`.

Again, refer to the PR labeler documentation [here](https://github.com/actions/labeler).
