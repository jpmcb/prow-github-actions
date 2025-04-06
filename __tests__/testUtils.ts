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
  private _ref: Request | null = null

  public set ref(req: Request) {
    this._ref = req
  }

  public get ref(): Request | null {
    return this._ref
  }

  public async body() {
    if (!this._ref) {
      return null
    }

    // Clone the request before reading the body to avoid consuming the stream
    const clonedRequest = this._ref.clone()

    try {
      // Parse the body as JSON
      return await clonedRequest.json()
    }
    catch (error) {
      console.error('Error parsing request body:', error)
      return null
    }
  }

  public called() {
    return new Promise<string>((resolve) => {
      const interval = setInterval(() => {
        if (this._ref) {
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
  return async ({ request }: { request: Request }) => {
    if (observeReq instanceof ObserveRequest) {
      observeReq.ref = request
    }

    if (replyBody) {
      return new Response(JSON.stringify(replyBody), {
        status: replyCode,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
    else {
      return new Response(null, { status: replyCode })
    }
  }
}
