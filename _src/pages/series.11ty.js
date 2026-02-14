const IS_PROD = process.env.PAGE_STATE === 'production'
class Series {
  data() {
    return {
      pagination: {
        data: 'collections.seriesWithEntries',
        size: 1,
        alias: 'seriesID',
      },
      pageCSS: 'series.css',
      eleventyComputed: {
        fullSeriesInfo: function ({ series, seriesID }) {
          return series.find((ser) => ser.id === seriesID)
        },
        permalink: function ({ fullSeriesInfo }) {
          return fullSeriesInfo && `/${this.slugify(fullSeriesInfo.name)}/`
        },
        title: function ({ fullSeriesInfo }) {
          return fullSeriesInfo.name
        },
      },
    }
  }

  renderItemContent(card) {
    const negativeOrPositive = Math.round(Math.random()) * 2 - 1
    const cardRotate = negativeOrPositive * (Math.random() * 3)
    const baseZIndex = Math.floor(Math.random() * 10) + 1

    return `
      <article class="card-card" style="--card-rotate: ${cardRotate}deg; --card-z-index: ${baseZIndex}">
        <p class="card-card__series"><small>Serie ${
          card.data.fullSeriesInfo.id
        }/${card.data.cardNumber}<small></p>
        <figure class="recipe-card-image">
          <img
            src="${card.data.image}"
            alt="${card.data.imageAlt || ''}"
            data-process-image
            data-image-sizes="15rem"
            data-image-widths="[320, 420, 640, 800]"
          />
        </figure>
        <h2 class="main-headline card-card__headline"><a href="${card.url}">${
      card.data.title
    }</a></h2>
      </article>
    `
  }

  renderCardList(cardsInSeries) {
    const listContent = cardsInSeries
      .map((card) => {
        const listItem = `<li>${this.renderItemContent(card)}</li>`

        return listItem
      })
      .join('')

    return `<ol role="list" class="card-archive-list">${listContent}</ol>`
  }

  render(data) {
    const seriesCollection = data.collections[
      `series:${this.slugify(data.fullSeriesInfo.name)}`
    ].filter((c) => (IS_PROD ? Date.now() >= c.data.date : true))

    return `
      <header class="series-archive-header">
        <h1>Serie ${data.seriesID} – ${data.fullSeriesInfo.name}</h1>
      </header>
      ${this.renderCardList(seriesCollection)}
    `
  }
}

export default Series
