# Cron jobs

The following jobs are supported through [cron Github workflows]().

Jobs | Description
--- | ---
`lgtm` | Will attempt to automatically merge a PR with the `lgtm` label. Blocked by the `hold` label. Removed by the [lgtm PR job on pr update](./pr-jobs.md)
`pr-labeler` | Labels PRs with labels based on file globs found in `.github/labels.yaml`. See [docs on PR labeler for more info](pr-labeling.md)
