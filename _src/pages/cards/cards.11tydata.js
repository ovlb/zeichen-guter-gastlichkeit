const IS_PROD = process.env.PAGE_STATE === 'production'

module.exports = {
  tags: ['card'],
  layout: 'card',
  pageCSS: 'card.css',
  permalink: function ({ series, title, seriesId, part, date }) {
    if (IS_PROD && date > Date.now()) {
      return false
    }

    const { name: seriesName } = series.find((ser) => ser.id === seriesId)
    const seriesSlug = this.slugify(seriesName.toLocaleLowerCase('de'))

    const titleSlug = this.slugify(title.toLocaleLowerCase('de'))

    return `/${seriesSlug}/${titleSlug}${
      part ? `-${part.toLocaleLowerCase('de')}` : ''
    }/`
  },
  eleventyComputed: {
    cardNumber: function ({ page }) {
      return page.fileSlug.split('-')[0]
    },
    image: function ({ seriesId, page }) {
      return `/cards/${seriesId}-${page.fileSlug}.jpg`
    },
    audio: function ({ seriesId, page, build }) {
      return `${build.cdnDomain}/audio/${seriesId}-${page.fileSlug}.mp3`
    },
    fullSeriesInfo: function ({ series, collections, seriesId }) {
      return {
        ...series.find((ser) => ser.id === seriesId),
        cards: collections.card
          .filter(
            (c) => c.data.seriesId === seriesId && Date.now() >= c.data.date,
          )
          .sort(
            (cardA, cardB) => cardA.data.cardNumber - cardB.data.cardNumber,
          ),
      }
    },
  },
}
