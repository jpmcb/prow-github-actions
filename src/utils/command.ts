export const getLineArgs = (command: string, body: string): string => {
  let toReturn = ''
  const lineArray = body.split('\n')

  for (const iterator of lineArray) {
    if (iterator.includes(command)) {
      toReturn = iterator.replace(`${command} `, '')
    }
  }

  return toReturn
}

export const getCommandArgs = (command: string, body: string): string[] => {
  const toReturn = []
  const lineArray = body.split('\n')
  let bodyArray = undefined

  for (const iterator of lineArray) {
    if (iterator.includes(command)) {
      bodyArray = iterator.split(' ')
    }
  }

  if (bodyArray === undefined) {
    throw new Error(`command ${command} missing from body`)
  }

  let i = 0
  while (bodyArray[i] !== command && i < bodyArray.length) {
    i++
  }

  // advance the index to the next as we've found the command
  i++
  while (bodyArray[i] !== '\n' && i < bodyArray.length) {
    toReturn.push(bodyArray[i])
    i++
  }

  return stripAtSign(toReturn)
}

const stripAtSign = (args: string[]): string[] => {
  const toReturn: string[] = []

  for (const e of args) {
    if (e.startsWith('@')) {
      toReturn.push(e.replace('@', ''))
    } else {
      toReturn.push(e)
    }
  }

  return toReturn
}
