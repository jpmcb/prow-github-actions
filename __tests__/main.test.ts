import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'

// shows how the runner will run a javascript action with env / stdout protocol
test('runs with no options', () => {
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecSyncOptions = {
    env: process.env
  }

  console.log(process.env)
  
  try{
  expect(cp.execSync(`node ${ip}`, options).toString()).toContain(
    'not yet supported'
  )
  } catch(e) {
    console.log("FAILED COMMAND OUTPUT",e)
    console.log("FAILED COMMAND STDERR",e.stderr.toString())
    console.log("FAILED COMMAND OUTPUT",e.output.toString())
    console.log("FAILED COMMAND STDOUT",e.stdout.toString())
    throw e
  }
})
