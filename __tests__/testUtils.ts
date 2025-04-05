import type { WebhookPayload } from '@actions/github/lib/interfaces'
import { Context } from '@actions/github/lib/context'

export const api = 'https://api.github.com'

// Generate and create a fake context to use
export const MockContext = class extends Context {
  constructor(payload: WebhookPayload) {
    super()
    this.payload = payload
  }
}

export function setupActionsEnv(command: string = '') {
  process.env = {}

  // set the neccessary env variables expected by the action:
  // https://help.github.com/en/github/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions#jobsjob_idstepswith
  process.env['INPUT_PROW-COMMANDS'] = command
  process.env['INPUT_GITHUB-TOKEN'] = 'some-token'
}

export function setupJobsEnv(arg: string = '') {
  process.env = {}

  // set the neccessary env variables expected by the action:
  // https://help.github.com/en/github/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions#jobsjob_idstepswith
  process.env.INPUT_JOBS = arg
  process.env['INPUT_GITHUB-TOKEN'] = 'some-token'
}

export class ObserveRequest {
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
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if ('method' in this.ref) {
          resolve('called')
          clearInterval(interval)
        }
      }, 1)
    })
  }
}

export function mockResponse(
  replyCode: number,
  replyBody?: any,
  observeReq?: ObserveRequest,
) {
  return (req: any, res: any, ctx: any) => {
    if (observeReq instanceof ObserveRequest) {
      observeReq.ref = req
    }

    if (replyBody) {
      return res(ctx.status(replyCode), ctx.json(replyBody))
    }
    else {
      return res(ctx.status(replyCode))
    }
  }
}
