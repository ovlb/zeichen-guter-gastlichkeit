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
            data-image-widths="[420, 800]"
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

  renderSeriesNav(data) {
    const navigableSeries = data.series.filter((s) =>
      data.collections.seriesWithEntries.includes(s.id),
    )
    const currentIndex = navigableSeries.findIndex(
      (s) => s.id === data.seriesID,
    )
    const prevSeries =
      currentIndex > 0 ? navigableSeries[currentIndex - 1] : null
    const nextSeries =
      currentIndex < navigableSeries.length - 1
        ? navigableSeries[currentIndex + 1]
        : null

    return `
      <div class="series-nav-container">
        <nav class="page-nav" aria-label="Seriennavigation">
          ${
            prevSeries
              ? `<a href="/${this.slugify(
                  prevSeries.name,
                )}/" class="page-nav__prev" rel="prev" data-prefetch>← ${
                  prevSeries.name
                }</a>`
              : ''
          }
          <span class="page-nav__position">${
            currentIndex + 1
          }&thinsp;/&thinsp;${navigableSeries.length}</span>
          ${
            nextSeries
              ? `<a href="/${this.slugify(
                  nextSeries.name,
                )}/" class="page-nav__next" rel="next" data-prefetch>${
                  nextSeries.name
                } →</a>`
              : ''
          }
        </nav>
        <nav class="page-nav-secondary" aria-label="Hauptnavigation">
          <a href="/">Start</a>
        </nav>
      </div>
    `
  }

  render(data) {
    const seriesCollection = data.collections.publishedCards.filter(
      (c) => c.data.seriesId === data.seriesID,
    )
    const hasPrevOrNext =
      data.series.filter((s) =>
        data.collections.seriesWithEntries.includes(s.id),
      ).length > 1

    return `
      <header class="series-archive-header">
        <h1>Serie ${data.seriesID} – ${data.fullSeriesInfo.name}</h1>
      </header>
      ${this.renderCardList(seriesCollection)}
      ${this.renderSeriesNav(data)}
      ${
        hasPrevOrNext
          ? '<script type="module" loading="lazy" src="/js/prefetch.js"></script>'
          : ''
      }
    `
  }
}

export default Series
