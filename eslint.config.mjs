import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'dist/',
    '**/dist/**/',
    'lib/',
    '**/lib/**/',
    'node_modules/',
    '**/node_modules/**/',
  ],
})
