import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import getFiles from '../_helper/get-files.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default async function (eleventyConfig) {
  const files = getFiles(__dirname).filter(
    (fileName) => fileName !== 'index.js',
  )

  for (const fileName of files) {
    const imported = await import(join(__dirname, fileName))

    eleventyConfig.addPlugin(imported.default)
  }
}
