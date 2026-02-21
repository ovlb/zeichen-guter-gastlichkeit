export default {
  tags: ['card'],
  layout: 'card',
  pageCSS: 'card.css',
  permalink: function ({ series, title, seriesId, part, date }) {
    if (!this.isPublished(date)) {
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
    podcastImage: function ({ seriesId, page }) {
      return `/img/podcast/${seriesId}-${page.fileSlug}-podcast.jpg`
    },
    feedImage: function ({ seriesId, page }) {
      return `/img/feed-images/${seriesId}-${page.fileSlug}-feed.jpg`
    },
    audio: function ({ seriesId, page, build }) {
      return `${build.cdnDomain}/audio/${seriesId}-${page.fileSlug}.mp3`
    },
    fullSeriesInfo: function ({ series, collections, seriesId }) {
      return {
        ...series.find((ser) => ser.id === seriesId),
        cards: collections.publishedCards
          .filter((c) => c.data.seriesId === seriesId)
          .sort(
            (cardA, cardB) => cardA.data.cardNumber - cardB.data.cardNumber,
          ),
      }
    },
  },
}
