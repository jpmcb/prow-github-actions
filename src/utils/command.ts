export const getCommandArgs = (command: string, body: string): string[] => {
  const bodyArray = body.split(' ')
  const toReturn = []

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
