/** Matches the Algolia record schema from sync-algolia-index.js */
export interface SearchRecord {
  objectID: string
  type: 'recipe' | 'drink'
  title: string
  parentTitle?: string
  ingredients: string
  seriesName: string
  image: string
  imageAlt: string
  url: string
}

export interface SearchHit extends SearchRecord {
  _highlightResult?: {
    title?: { value: string }
    ingredients?: { value: string }
  }
}
