# Labeling

Prow github actions expects the file `.github/labels.yaml`
to be present for most labeling commands and jobs.
All of the following examples can be placed simultaneously in the `.github/labels.yaml` file.

## Area labels
```yaml
area:
  - 'bug'
  - 'important'
```
With the command `/area bug`,
the issue or PR will be labeled with `area/bug`

## Kind labels
```yaml
kind:
  - 'failing-test'
  - 'cleanup'
```
With the command `/kind cleanup`,
the issue or PR will be labeled with `kind/cleanup`

## Priority labels
```yaml
priority:
  - 'low'
  - 'high'
```
With the command `/priority low`,
the issue or PR will be labeled with `priority/low`

## PR labels
```yaml
source:
  - 'src/**'
```
If using the [github actions/labeler](https://github.com/actions/labeler/blob/main/README.md) PR labeler,
any PR with a changed file that matches file globs found in `.github/labels.yaml`
will be labeled. So, in this example, a PR with a changed file named `src/some/sourcefile.js`
will be labeled with `source`. The [Digital Ocean Glob Tool](https://www.digitalocean.com/community/tools/glob)
can be helpful when specifying file globs. 

Note that the Github API will _not_ return a leading slash
for files found within the repository. 
So, for example, a root level readme file will appear as `README.md`.
