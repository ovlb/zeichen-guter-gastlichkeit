import { isPublished } from '../_helper/content-scheduling.js'

export default function (collectionAPI) {
  const cards = collectionAPI.getFilteredByGlob('_src/pages/cards/**/*.md')

  const seriesIDs = new Set()

  cards.forEach((card) => {
    if (isPublished(card.data.date)) {
      seriesIDs.add(card.data.seriesId)
    }
  })

  return [...seriesIDs]
}
