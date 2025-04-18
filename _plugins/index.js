import { dirname } from 'path'
import { fileURLToPath } from 'url'
import getFolderExports from '../_helper/get-folder-exports.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default async function (eleventyConfig) {
  const plugins = await getFolderExports(__dirname)

  plugins.forEach(({ func }) => {
    eleventyConfig.addPlugin(func.plugin, func.pluginOptions || {})
  })
}
