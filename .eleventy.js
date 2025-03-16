const path = require('path')
const del = require('del')

const STATIC_FOLDERS = require('./_helper/paths')
const { readdir } = require('fs/promises')

const IS_PROD = process.env.PAGE_STATE === 'production'

module.exports = async function (eleventyConfig) {
  eleventyConfig.addPlugin(require('./_plugins'))

  eleventyConfig.addPlugin(require('./_shortcodes'))

  eleventyConfig.addPlugin(require('./_functions'))

  eleventyConfig.addPlugin(require('./_libraries'))

  eleventyConfig.addPlugin(require('./_transforms'))

  eleventyConfig.addPlugin(require('./_templates'))

  const events = await import('./_events/index.mjs')
  eleventyConfig.addPlugin(events.default)

  eleventyConfig.addCollection('seriesWithEntries', function (collectionAPI) {
    const cards = collectionAPI.getFilteredByGlob('_src/pages/cards/**/*.md')

    const seriesIDs = new Set()

    cards.forEach((card) => {
      if (Date.now() >= card.data.date || !IS_PROD) {
        seriesIDs.add(card.data.seriesId)
      }
    })

    return [...seriesIDs]
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
