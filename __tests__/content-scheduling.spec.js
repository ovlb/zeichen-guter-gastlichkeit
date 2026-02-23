import test from 'ava'
import Eleventy from '@11ty/eleventy'
import { readdir, readFile } from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

let results

test.before(async () => {
  const elev = new Eleventy('_src', '_test-dist', {
    configPath: '__tests__/_eleventy-config.js',
    source: 'script',
  })
  results = await elev.toJSON()
})

function isCardResult(result) {
  return (
    result.inputPath.startsWith('./_src/pages/cards/') &&
    result.inputPath.endsWith('.md')
  )
}

function isPublishedCard(result) {
  return isCardResult(result) && typeof result.url === 'string'
}

function parseCardData(content) {
  const match = content.match(/<card-data([^>]*)>/)
  if (!match) return null

  const attrs = {}
  const attrPattern = /data-([\w-]+)="([^"]*)"/g
  let attrMatch
  while ((attrMatch = attrPattern.exec(match[1])) !== null) {
    const key = attrMatch[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    attrs[key] = attrMatch[2]
  }
  return attrs
}

function isSeriesResult(result) {
  return result.inputPath === './_src/pages/series.11ty.js'
}

async function findCardFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await findCardFiles(fullPath)))
    } else if (entry.name.endsWith('.md') && !entry.name.startsWith('CLAUDE')) {
      files.push(fullPath)
    }
  }

  return files
}

test('no future-dated cards get a URL', async (t) => {
  const cardFiles = await findCardFiles('_src/pages/cards')
  const now = Date.now()

  for (const file of cardFiles) {
    const raw = await readFile(file, 'utf-8')
    const { data } = matter(raw)

    if (!data.date) continue

    const date = new Date(data.date)
    const cardResults = results.filter((r) => r.inputPath === `./${file}`)

    if (date.getTime() > now) {
      for (const result of cardResults) {
        t.is(
          result.url,
          false,
          `future-dated card should have no URL: ${file} (date: ${data.date})`,
        )
      }
    } else {
      t.is(
        cardResults.length,
        1,
        `published card should be present: ${file} (date: ${data.date})`,
      )
      t.is(
        typeof cardResults[0].url,
        'string',
        `published card should have a string URL: ${file}`,
      )
    }
  }
})

test('card URLs follow /{series-slug}/{title-slug}/ pattern', (t) => {
  const publishedCards = results.filter(isPublishedCard)

  t.true(publishedCards.length > 0, 'should have published cards')

  for (const result of publishedCards) {
    t.true(result.url.startsWith('/'), `URL starts with /: ${result.url}`)
    t.true(result.url.endsWith('/'), `URL ends with /: ${result.url}`)

    const segments = result.url.split('/').filter(Boolean)
    t.true(
      segments.length >= 2,
      `URL has at least series + title segments: ${result.url}`,
    )
  }
})

test('series pages exist only for series with published cards', (t) => {
  const publishedCards = results.filter(isPublishedCard)
  const seriesResults = results.filter(isSeriesResult)

  const seriesIdsWithCards = new Set()
  for (const card of publishedCards) {
    const seriesDir = card.inputPath.match(/\.?\/?_src\/pages\/cards\/(\d+)\//)
    if (seriesDir) {
      seriesIdsWithCards.add(Number(seriesDir[1]))
    }
  }

  t.is(
    seriesResults.length,
    seriesIdsWithCards.size,
    `number of series pages (${seriesResults.length}) should match series with published cards (${seriesIdsWithCards.size})`,
  )
})

test('every published card has content', (t) => {
  const publishedCards = results.filter(isPublishedCard)

  t.true(publishedCards.length > 0, 'should have published cards')

  for (const result of publishedCards) {
    t.truthy(result.url, `card has a URL: ${result.inputPath}`)
    t.truthy(result.content, `card has content: ${result.inputPath}`)
  }
})

test('computed card data is set correctly', (t) => {
  const publishedCards = results.filter(isPublishedCard)

  for (const result of publishedCards) {
    const data = parseCardData(result.content)
    t.truthy(data, `card data should be parseable: ${result.inputPath}`)

    // inputPath: ./_src/pages/cards/{seriesId}/{fileSlug}.md
    const pathMatch = result.inputPath.match(/\/cards\/(\d+)\/([\w-]+)\.md$/)
    const seriesId = pathMatch[1]
    const fileSlug = pathMatch[2]

    t.is(
      data.cardNumber,
      fileSlug.split('-')[0],
      `cardNumber derived from fileSlug: ${result.inputPath}`,
    )
    t.is(
      data.image,
      `/cards/${seriesId}-${fileSlug}.jpg`,
      `image path: ${result.inputPath}`,
    )
    t.is(
      data.podcastImage,
      `/img/podcast/${seriesId}-${fileSlug}-podcast.jpg`,
      `podcastImage path: ${result.inputPath}`,
    )
    t.is(
      data.feedImage,
      `/img/feed-images/${seriesId}-${fileSlug}-feed.jpg`,
      `feedImage path: ${result.inputPath}`,
    )
    t.true(
      data.audio.endsWith(`/audio/${seriesId}-${fileSlug}.mp3`),
      `audio URL: ${result.inputPath}`,
    )
    t.is(
      data.seriesId,
      seriesId,
      `seriesId matches directory: ${result.inputPath}`,
    )
    t.truthy(data.seriesName, `series name is set: ${result.inputPath}`)
    t.true(
      Number(data.seriesCardCount) >= 1,
      `fullSeriesInfo.cards has at least 1 entry: ${result.inputPath}`,
    )
  }
})

test('fullSeriesInfo.cards only contains published cards', (t) => {
  const publishedCards = results.filter(isPublishedCard)

  // Group published cards by series
  const publishedCountBySeries = new Map()
  for (const card of publishedCards) {
    const data = parseCardData(card.content)
    const current = publishedCountBySeries.get(data.seriesId) || 0
    publishedCountBySeries.set(data.seriesId, current + 1)
  }

  // Each card's seriesCardCount should match the total published cards in that series
  for (const card of publishedCards) {
    const data = parseCardData(card.content)
    t.is(
      Number(data.seriesCardCount),
      publishedCountBySeries.get(data.seriesId),
      `seriesCardCount matches published card count for series ${data.seriesId}: ${card.inputPath}`,
    )
  }
})
