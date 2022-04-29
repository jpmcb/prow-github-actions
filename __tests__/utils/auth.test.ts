import {getOwnersFilePath} from '../../src/utils/auth'

describe('determines the path to OWNERS', () => {
  it('uses GITHUB_WORKSPACE', () => {
    process.env.GITHUB_WORKSPACE = "/workspace"
    const path = getOwnersFilePath()
    expect(path).toEqual("/workspace/OWNERS")
  })

  it('defaults to the working directory', () => {
    process.env.GITHUB_WORKSPACE = ''
    const path = getOwnersFilePath()
    expect(path).toEqual("./OWNERS")
  })
})