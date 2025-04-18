import path from 'path'
import camelCase from 'lodash/camelCase.js'
import getFilesOfType from './get-files.js'

export default async function getFolderExports(folder) {
  const functions = []
  const files = getFilesOfType(folder)

  for (const fileName of files) {
    if (fileName !== 'index.js') {
      const name = camelCase(fileName.replace('.js', ''))

      const imported = await import(path.join(folder, fileName))

      functions.push({ name, func: imported.default })
    }
  }

  return functions
}
