import path from 'path'
import del from 'del'
import STATIC_FOLDERS from './_helper/paths.js'
import { readdir } from 'fs/promises'

export default async function (eleventyConfig) {
  const configPlugins = await Promise.all([
    import('./_collections/index.js'),
    import('./_plugins/index.js'),
    import('./_shortcodes/index.js'),
    import('./_functions/index.js'),
    import('./_libraries/index.js'),
    import('./_transforms/index.js'),
    import('./_templates/index.js'),
    import('./_events/index.js'),
  ])

  configPlugins.forEach((plugin) => {
    eleventyConfig.addPlugin(plugin.default)
  })

  eleventyConfig.addLayoutAlias('base', 'layouts/base.njk')
  eleventyConfig.addLayoutAlias('card', 'layouts/card.njk')
  eleventyConfig.addLayoutAlias('home', 'layouts/home.njk')

  eleventyConfig.addWatchTarget(`./${STATIC_FOLDERS.static}/**/*`)
  eleventyConfig.addWatchTarget('./_helper/**/*')

  // copy static assets to dist folder
  eleventyConfig.addPassthroughCopy({ [`./${STATIC_FOLDERS.img}`]: '/img/' })
  eleventyConfig.addPassthroughCopy({
    [`./${STATIC_FOLDERS.files}`]: '/files/',
  })

  return {
    templateFormats: ['md', '11ty.js', 'njk'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    dir: {
      input: '_src',
      output: 'dist',
      data: '_data',
      includes: '_includes',
    },
  }
}
