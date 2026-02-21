import { readFileSync } from 'fs'
import { IS_PROD } from '../../_helper/content-scheduling.js'

// Series 5-6 are drinks (cocktails/longdrinks)
const DRINK_SERIES = [5, 6]
// Series 8+ are food recipes
const MIN_RECIPE_SERIES = 8

/**
 * Extract the first real paragraph from content (skip subtitle lines starting with "(")
 */
function extractIngredients(content) {
  const paragraphs = content.split('\n\n')

  for (const p of paragraphs) {
    const trimmed = p.trim()
    if (!trimmed) continue
    // Skip subtitle lines like "(kalte spanische Gemüsesuppe)"
    if (trimmed.startsWith('(')) continue
    // Skip markdown headings
    if (trimmed.startsWith('#')) continue
    return trimmed
  }

  return ''
}

/**
 * Split a drinks card (series 5-6) into individual sub-recipe records.
 * Each ## heading is a separate drink. Also handles cards where the first
 * recipe uses an # h1 heading before the first ## (e.g. Rüdesheimer Eisfrappé).
 */
function splitDrinks(content) {
  const drinks = []
  const sections = content.split(/\n(?=## )/)

  for (const section of sections) {
    const h2Match = section.match(/^## (.+)\n/)
    if (h2Match) {
      const title = h2Match[1].trim()
      const afterHeading = section.slice(h2Match[0].length).trim()
      const ingredients = afterHeading.split('\n\n')[0]?.trim() || ''
      drinks.push({ title, ingredients })
      continue
    }

    // First section (before any ##) — check for an h1 recipe
    const h1Match = section.match(/^# (.+)\n/)
    if (h1Match) {
      const title = h1Match[1].trim()
      const afterHeading = section.slice(h1Match[0].length).trim()
      const ingredients = afterHeading.split('\n\n')[0]?.trim() || ''
      if (ingredients) {
        drinks.push({ title, ingredients })
      }
    }
  }

  return drinks
}

/**
 * Extract markdown body (after frontmatter) from raw file content
 */
function extractBody(raw) {
  const match = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/)
  return match ? match[1].trim() : raw.trim()
}

class AlgoliaRecords {
  data() {
    return {
      permalink: IS_PROD ? '/algolia-records.json' : false,
      layout: null,
      eleventyExcludeFromCollections: true,
    }
  }

  render({ collections, series }) {
    const records = []

    for (const card of collections.publishedCards) {
      const { seriesId, title, date, imageAlt } = card.data
      const fileSlug = card.page.fileSlug

      const isDrink = DRINK_SERIES.includes(seriesId)
      const isRecipe = seriesId >= MIN_RECIPE_SERIES
      if (!isDrink && !isRecipe) continue

      const seriesInfo = series.find((s) => s.id === seriesId)
      if (!seriesInfo) continue

      const raw = readFileSync(card.page.inputPath, 'utf-8')
      const content = extractBody(raw)
      const dateUnix = Math.floor(new Date(date).getTime() / 1000)

      const baseRecord = {
        type: isDrink ? 'drink' : 'recipe',
        date: dateUnix,
        seriesId,
        seriesName: seriesInfo.name,
        image: `/img/search/${seriesId}-${fileSlug}-search.avif`,
        imageAlt: imageAlt || '',
        url: card.url,
      }

      if (isDrink) {
        const drinkList = splitDrinks(content)
        const baseID = `${seriesId}-${fileSlug}`

        for (let i = 0; i < drinkList.length; i++) {
          const drink = drinkList[i]
          records.push({
            objectID: `${baseID}-${i}-${this.slugify(
              drink.title.toLocaleLowerCase('de'),
            )}`,
            title: drink.title,
            parentTitle: title,
            ingredients: drink.ingredients,
            ...baseRecord,
          })
        }
      } else {
        records.push({
          objectID: `${seriesId}-${fileSlug}`,
          title,
          ingredients: extractIngredients(content),
          ...baseRecord,
        })
      }
    }

    return JSON.stringify(records)
  }
}

export default AlgoliaRecords
