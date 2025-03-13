module.exports = {
  tags: ['card'],
  layout: 'card',
  pageCSS: 'card.css',
  permalink: function ({ series, title, seriesId, part }) {
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
      return `${seriesId}-${page.fileSlug}.jpg`
    },
    audio: function ({ seriesId, page, build }) {
      return `${build.cdnDomain}/${seriesId}-${page.fileSlug}.mp3`
    },
    fullSeriesInfo: function ({ series, collections, seriesId }) {
      return {
        ...series.find((ser) => ser.id === seriesId),
        cards: collections.card
          .filter((c) => c.data.seriesId === seriesId)
          .sort(
            (cardA, cardB) => cardA.data.cardNumber - cardB.data.cardNumber,
          ),
      }
    },
  },
}
