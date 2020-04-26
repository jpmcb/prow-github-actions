import {getCommandArgs} from '../../src/utils/command'

it('handles comments with multiple lines', () => {
  const body = `Here is something
here's some more
/command arg1 arg2
/another-comment arg3 arg4
invalid`

  let output = getCommandArgs('/command', body)

  expect(output).toMatchObject(['arg1', 'arg2'])

  output = getCommandArgs('/another-comment', body)

  expect(output).toMatchObject(['arg3', 'arg4'])
})

describe('strips at signs', () => {
  it('first char of argument', () => {
    const body = `/command @user@name @other@username`

    let output = getCommandArgs('/command', body)

    expect(output).toMatchObject(['user@name', 'other@username'])
  })
})
