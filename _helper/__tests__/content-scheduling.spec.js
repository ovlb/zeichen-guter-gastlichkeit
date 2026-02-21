import test from 'ava'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import { isPublished } from '../content-scheduling.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cardsDir = path.resolve(__dirname, '../../_src/pages/cards')

// --- helpers (same pattern as cards.spec.mjs) ---

async function collectMarkdownFiles() {
  const results = []
  const folders = await fs.readdir(cardsDir)

  for (const folder of folders) {
    const folderPath = path.join(cardsDir, folder)
    let stats
    try {
      stats = await fs.stat(folderPath)
    } catch {
      continue
    }
    if (
      !stats.isDirectory() ||
      folder.startsWith('_') ||
      folder.startsWith('.')
    )
      continue

    const files = (await fs.readdir(folderPath)).filter((f) =>
      f.endsWith('.md'),
    )
    if (files.length === 0) continue

    const parsedFiles = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(path.join(folderPath, file), 'utf-8')
        const match = content.match(/^---\n([\s\S]*?)\n---/)
        return {
          path: path.join(folderPath, file),
          frontMatter: match ? match[1].split('\n') : [],
        }
      }),
    )

    results.push({ parsedFiles })
  }

  return results
}

function parseDate(frontmatterLine) {
  const match = /date:\s*(.+)/.exec(frontmatterLine)
  return match ? new Date(match[1].trim()) : null
}

// --- tests ---

test('isPublished filters a card collection to only past-dated items', (t) => {
  const cards = [
    { data: { date: new Date('2024-01-01').getTime(), title: 'Past' } },
    { data: { date: new Date('2099-01-01').getTime(), title: 'Future' } },
  ]
  const published = cards.filter((c) => isPublished(c.data.date))
  t.is(published.length, 1)
  t.is(published[0].data.title, 'Past')
})

test('publishedCards collection pattern excludes future-dated cards', (t) => {
  const allCards = [
    { data: { date: new Date('2024-06-01').getTime() } },
    { data: { date: new Date('2024-09-15').getTime() } },
    { data: { date: new Date('2099-12-31').getTime() } },
  ]
  const publishedCards = allCards.filter((c) => isPublished(c.data.date))
  t.is(publishedCards.length, 2)
  t.true(publishedCards.every((c) => isPublished(c.data.date)))
})

test('future date is not published', (t) => {
  const futureDate = new Date('2099-01-01').getTime()
  t.false(isPublished(futureDate))
})

test('actual card dates: past cards are published, future cards are not', async (t) => {
  const processedDirs = await collectMarkdownFiles()

  for (const { parsedFiles } of processedDirs) {
    for (const file of parsedFiles) {
      const date = parseDate(file.frontMatter[1])
      if (!date) continue
      const dateMs = date.getTime()
      const expected = Date.now() >= dateMs
      t.is(isPublished(dateMs), expected, path.basename(file.path))
    }
  }
})

test('card dated today at midnight is published (>= not >)', (t) => {
  const todayMidnight = new Date()
  todayMidnight.setHours(0, 0, 0, 0)
  t.true(isPublished(todayMidnight.getTime()))
})
