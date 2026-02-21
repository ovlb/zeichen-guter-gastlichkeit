import { dirname } from 'path'
import { fileURLToPath } from 'url'

import getFolderExports from '../_helper/get-folder-exports.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default async function (eleventyConfig) {
  const collections = await getFolderExports(__dirname)

  collections.forEach(({ name, func }) => {
    eleventyConfig.addCollection(name, func)
  })
}
