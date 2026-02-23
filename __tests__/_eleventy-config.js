import contentScheduling from '../_plugins/content-scheduling.js'
import publishedCards from '../_collections/published-cards.js'
import seriesWithEntries from '../_collections/series-with-entries.js'

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(contentScheduling.plugin)
  eleventyConfig.addCollection('publishedCards', publishedCards)
  eleventyConfig.addCollection('seriesWithEntries', seriesWithEntries)

  eleventyConfig.addLayoutAlias('card', 'layouts/card.njk')
  eleventyConfig.addLayoutAlias('base', 'layouts/base.njk')
  eleventyConfig.addLayoutAlias('home', 'layouts/base.njk')

  // Override real layouts with minimal versions via virtual templates.
  // The card layout renders computed data as HTML data attributes
  // so integration tests can verify the data cascade.
  eleventyConfig.addTemplate(
    '_includes/layouts/card.njk',
    [
      '<card-data',
      '  data-card-number="{{ cardNumber }}"',
      '  data-image="{{ image }}"',
      '  data-podcast-image="{{ podcastImage }}"',
      '  data-feed-image="{{ feedImage }}"',
      '  data-audio="{{ audio }}"',
      '  data-series-id="{{ fullSeriesInfo.id }}"',
      '  data-series-name="{{ fullSeriesInfo.name }}"',
      '  data-series-card-count="{{ fullSeriesInfo.cards | length }}"',
      '></card-data>',
      '{{ content | safe }}',
    ].join('\n'),
  )
  eleventyConfig.addTemplate(
    '_includes/layouts/base.njk',
    '{{ content | safe }}',
  )

  eleventyConfig.ignores.add('_src/pages/podcast.11ty.js')
  eleventyConfig.ignores.add('_src/pages/feed.11ty.mjs')
  eleventyConfig.ignores.add('_src/pages/algolia-records.11ty.js')
  eleventyConfig.ignores.add('_src/pages/recipeData.11ty.js')
  eleventyConfig.ignores.add('_src/pages/index.11ty.js')
  eleventyConfig.ignores.add('_src/pages/suche.11ty.js')
  eleventyConfig.ignores.add('_src/pages/hinweise.md')
  eleventyConfig.ignores.add('_src/robots.njk')
  eleventyConfig.ignores.add('**/CLAUDE.md')

  return {
    templateFormats: ['md', '11ty.js', 'njk'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    dir: {
      input: '_src',
      output: '_test-dist',
      data: '_data',
      includes: '_includes',
    },
  }
}
