#!/usr/bin/env node

import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import slugify from '@sindresorhus/slugify'
import { algoliasearch } from 'algoliasearch'

import seriesData from '../_src/_data/series.js'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cardsDir = path.resolve(__dirname, '../_src/pages/cards')

const RECIPE_INDEX = 'recipes'
const DRINKS_INDEX = 'drinks'

// Series 5-6 are drinks (cocktails/longdrinks)
const DRINK_SERIES = [5, 6]
// Series 8+ are food recipes
const MIN_RECIPE_SERIES = 8

/**
 * Parse frontmatter and content from a markdown file
 */
function parseMarkdown(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return null

  const frontmatter = {}
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()

    // Remove surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    frontmatter[key] = value
  }

  return { frontmatter, content: match[2].trim() }
}

/**
 * Get series info by ID
 */
function getSeriesInfo(seriesId) {
  return seriesData.find((s) => s.id === seriesId)
}

/**
 * Build URL for a card, replicating cards.11tydata.js permalink logic
 */
function buildUrl(seriesName, title) {
  const seriesSlug = slugify(seriesName.toLocaleLowerCase('de'))
  const titleSlug = slugify(title.toLocaleLowerCase('de'))
  return `/${seriesSlug}/${titleSlug}/`
}

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
 * Build recipe records (series 8+)
 */
function buildRecipeRecord({ frontmatter, content, seriesId, fileSlug }) {
  const series = getSeriesInfo(seriesId)
  if (!series) return null

  const objectID = frontmatter.id || `${seriesId}-${fileSlug}`
  const ingredients = extractIngredients(content)

  return {
    objectID,
    title: frontmatter.title,
    ingredients,
    seriesId,
    seriesName: series.name,
    image: `/img/podcast/${seriesId}-${fileSlug}-podcast.jpg`,
    imageAlt: frontmatter.imageAlt || '',
    url: buildUrl(series.name, frontmatter.title),
  }
}

/**
 * Build drink records (series 5-6), one per sub-recipe
 */
function buildDrinkRecords({ frontmatter, content, seriesId, fileSlug }) {
  const series = getSeriesInfo(seriesId)
  if (!series) return []

  const drinks = splitDrinks(content)
  const baseID = frontmatter.id || `${seriesId}-${fileSlug}`

  return drinks.map((drink, index) => ({
    objectID: `${baseID}-${index}-${slugify(
      drink.title.toLocaleLowerCase('de'),
    )}`,
    title: drink.title,
    parentTitle: frontmatter.title,
    ingredients: drink.ingredients,
    seriesId,
    seriesName: series.name,
    image: `/img/podcast/${seriesId}-${fileSlug}-podcast.jpg`,
    imageAlt: frontmatter.imageAlt || '',
    url: buildUrl(series.name, frontmatter.title),
  }))
}

/**
 * Read all relevant card files and build index records
 */
async function buildRecords() {
  const recipes = []
  const drinks = []

  const seriesDirs = await fs.readdir(cardsDir)

  for (const dir of seriesDirs) {
    const seriesId = parseInt(dir)
    if (isNaN(seriesId)) continue

    const isDrink = DRINK_SERIES.includes(seriesId)
    const isRecipe = seriesId >= MIN_RECIPE_SERIES
    if (!isDrink && !isRecipe) continue

    const seriesPath = path.join(cardsDir, dir)
    const files = await fs.readdir(seriesPath)
    const mdFiles = files.filter((f) => f.endsWith('.md'))

    for (const file of mdFiles) {
      const raw = await fs.readFile(path.join(seriesPath, file), 'utf-8')
      const parsed = parseMarkdown(raw)
      if (!parsed) continue

      const fileSlug = file.replace('.md', '')

      if (isDrink) {
        const drinkRecords = buildDrinkRecords({
          ...parsed,
          seriesId,
          fileSlug,
        })
        drinks.push(...drinkRecords)
      } else {
        const record = buildRecipeRecord({ ...parsed, seriesId, fileSlug })
        if (record) recipes.push(record)
      }
    }
  }

  return { recipes, drinks }
}

/**
 * Configure index settings
 */
async function configureIndex(client, indexName) {
  await client.setSettings({
    indexName,
    indexSettings: {
      searchableAttributes: ['title', 'ingredients'],
      attributesForFaceting: ['seriesName'],
      attributesToRetrieve: [
        'title',
        'parentTitle',
        'ingredients',
        'seriesName',
        'image',
        'imageAlt',
        'url',
      ],
      attributesToHighlight: ['title', 'ingredients'],
    },
  })
}

/**
 * Sync records to Algolia
 */
export async function syncAlgoliaIndex() {
  const appId = process.env.ALGOLIA_APP_ID
  const apiKey = process.env.ALGOLIA_WRITE_API_KEY

  if (!appId || !apiKey) {
    console.log(
      '⏭️ Skipping Algolia sync: ALGOLIA_APP_ID or ALGOLIA_WRITE_API_KEY not set',
    )
    return
  }

  const client = algoliasearch(appId, apiKey)
  const { recipes, drinks } = await buildRecords()

  console.log(
    `📦 Built ${recipes.length} recipe records, ${drinks.length} drink records`,
  )

  // Configure indexes
  await Promise.all([
    configureIndex(client, RECIPE_INDEX),
    configureIndex(client, DRINKS_INDEX),
  ])

  // Save records (replaceAllObjects = full replace)
  const results = await Promise.all([
    recipes.length
      ? client.replaceAllObjects({ indexName: RECIPE_INDEX, objects: recipes })
      : Promise.resolve(),
    drinks.length
      ? client.replaceAllObjects({ indexName: DRINKS_INDEX, objects: drinks })
      : Promise.resolve(),
  ])

  console.log(`✅ Algolia sync complete`)
  return results
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  syncAlgoliaIndex()
    .then(() => console.log('Done'))
    .catch((err) => {
      console.error('❌ Error:', err)
      process.exit(1)
    })
}
