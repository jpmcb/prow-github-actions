import {Context} from '@actions/github/lib/context'
import {WebhookPayload} from '@actions/github/lib/interfaces'

export const api = 'https://api.github.com'

// Generate and create a fake context to use
export const mockContext = class extends Context {
  constructor(payload: WebhookPayload) {
    super()
    this.payload = payload
  }
}

export const setupActionsEnv = (command: string = '') => {
  process.env = {}

  // set the neccessary env variables expected by the action:
  // https://help.github.com/en/github/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions#jobsjob_idstepswith
  process.env['INPUT_PROW-COMMANDS'] = command
  process.env['INPUT_GITHUB-TOKEN'] = 'some-token'
}

export const setupJobsEnv = (arg: string = '') => {
  process.env = {}

  // set the neccessary env variables expected by the action:
  // https://help.github.com/en/github/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions#jobsjob_idstepswith
  process.env['INPUT_JOBS'] = arg
  process.env['INPUT_GITHUB-TOKEN'] = 'some-token'
}

export class observeRequest {
  private _ref: any = {}

  public set ref(req: any) {
    this._ref = req
  }

  public get ref() {
    return this._ref
  }

  public body() {
    const decoder = new TextDecoder('utf-8')

    return JSON.parse(decoder.decode(this._ref?._body))
  }

  public called() {
    const obj = this
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if ('method' in obj.ref) {
          resolve('called')
          clearInterval(interval)
        }
      }, 1)
    })
  }
}

export const mockResponse = (
  replyCode: number,
  replyBody?: any,
  observeReq?: observeRequest
) => {
  return (req: any, res: any, ctx: any) => {
    if (observeReq instanceof observeRequest) {
      observeReq.ref = req
    }

    if (replyBody) {
      return res(ctx.status(replyCode), ctx.json(replyBody))
    } else {
      return res(ctx.status(replyCode))
    }
  }
}
