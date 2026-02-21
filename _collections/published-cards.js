import { isPublished } from '../_helper/content-scheduling.js'

export default function (collectionAPI) {
  return collectionAPI
    .getFilteredByGlob('_src/pages/cards/**/*.md')
    .filter((card) => isPublished(card.data.date))
}
