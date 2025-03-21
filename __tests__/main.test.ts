import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'

// shows how the runner will run a javascript action with env / stdout protocol
test('runs with no options', () => {
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecSyncOptions = {
    env: process.env
  }

  // When this test is run through GitHub Actions, GITHUB_EVENT_NAME is set to pull_request
  // clear it out so that we hit the default behavior when nothing is specified
  if (options.env) {
    options.env.GITHUB_EVENT_NAME = ''
  }

  try {
    expect(cp.execSync(`node ${ip}`, options).toString()).toContain(
      'not yet supported'
    )
  } catch (e) {
    if (
      typeof e === 'object' &&
      e &&
      'output' in e &&
      typeof e.output === 'string'
    ) {
      console.log(
        "Calling the github action's main function without any context failed:",
        e.output.toString()
      )
    }
    throw e
  }
})
