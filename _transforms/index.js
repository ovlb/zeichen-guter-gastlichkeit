import camelCase from 'lodash/camelCase.js'
import getFiles from '../_helper/get-files.js'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const { ELEVENTY_ENV } = process.env
const IS_PROD = ELEVENTY_ENV === 'production'

export default async function (eleventyConfig) {
  const files = getFiles(__dirname).filter(
    (fileName) => fileName !== 'index.js',
  )

  for (const fileName of files) {
    const imported = await import(join(__dirname, fileName))
    const name = camelCase(fileName.replace('.js', ''))
    const { when, transform } = imported.default

    console.log('🧑‍🔬 transforms', name, when, typeof transform)

    if (when === 'prod' && IS_PROD) {
      eleventyConfig.addTransform(name, transform)

      return
    }

    eleventyConfig.addTransform(name, transform)
  }
}
