import { dirname } from 'path'
import { fileURLToPath } from 'url'

import getFolderExports from '../_helper/get-folder-exports.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default async function (eleventyConfig) {
  const shortcodes = await getFolderExports(__dirname)

  shortcodes.forEach(({ name, func }) => {
    eleventyConfig.addShortcode(name, func)
  })
}
