class Series {
  data() {
    return {
      pagination: {
        data: 'collections.seriesWithEntries',
        size: 1,
        alias: 'seriesID',
      },
      eleventyComputed: {
        fullSeriesInfo: function ({ series, seriesID }) {
          return series.find((ser) => ser.id === seriesID)
        },
        permalink: function ({ fullSeriesInfo }) {
          return (
            fullSeriesInfo && `/${fullSeriesInfo.name.toLocaleLowerCase('de')}/`
          )
        },
      },
    }
  }

  renderCardList(seriesID, cards) {
    const cardsInSeries = cards.filter(
      (card) => card.data.seriesId === seriesID,
    )
    const listContent = cardsInSeries
      .map((card) => {
        const listItem = `<li><a href="${card.url}>${card.data.title}</a></li>`

        return listItem
      })
      .join('')

    return `<ol>${listContent}</ol>`
  }

  render(data) {
    return `
      <h1>Series ${data.seriesID} – ${data.fullSeriesInfo.name}</h1>
      ${this.renderCardList(data.seriesID, data.collections.card)}
    `
  }
}

module.exports = Series
