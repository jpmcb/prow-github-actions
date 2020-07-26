# Automatic PR merging

Prow github actions supports automatic PR merging through
[Github actions cron jobs]().

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
This Github workflow will check every hour
for PRs with the `lgtm` label and will attempt to automatically merge them.
If the `hold` label is present, it will block automatic merging.
