import test from 'ava'
import {
  readFeedFile,
  parseFeedXml,
  getAllElements,
  getTextContent,
  countPublishedCards,
} from './helpers.js'

let doc
let items

test.before(async () => {
  const xml = await readFeedFile('feeds/cards.xml')
  doc = parseFeedXml(xml)
  items = getAllElements(doc, 'item')
})

// -- Structural correctness --

test('XML parses without error', (t) => {
  t.truthy(doc, 'document should exist after parsing')
})

test('channel has required RSS fields', (t) => {
  const channel = doc.getElementsByTagName('channel')[0]
  t.truthy(channel, 'channel element must exist')

  for (const field of ['title', 'description', 'link']) {
    const value = getTextContent(channel, field)
    t.truthy(value, `channel must have non-empty <${field}>`)
  }
})

// -- Data correctness --

test('entry count matches published cards', async (t) => {
  const expectedCount = await countPublishedCards()
  t.is(
    items.length,
    expectedCount,
    `expected ${expectedCount} entries, got ${items.length}`,
  )
})

test('every item has a valid absolute link URL', (t) => {
  for (const item of items) {
    const link = getTextContent(item, 'link')
    t.truthy(link, 'every item must have a link')
    t.true(
      link.startsWith('https://'),
      `link "${link}" must be an absolute HTTPS URL`,
    )
  }
})

test('every item has a valid guid', (t) => {
  for (const item of items) {
    const guid = getTextContent(item, 'guid') || getTextContent(item, 'id')
    t.truthy(guid, 'every item must have a guid or id')
    t.true(
      guid.startsWith('https://'),
      `guid "${guid}" must be a valid HTTPS URL`,
    )
  }
})

test('every item has non-empty title', (t) => {
  for (const item of items) {
    const title = getTextContent(item, 'title')
    t.truthy(title, 'every item must have a non-empty title')
  }
})

test('every item has a valid date', (t) => {
  for (const item of items) {
    const pubDate =
      getTextContent(item, 'pubDate') || getTextContent(item, 'updated')
    t.truthy(pubDate, 'every item must have pubDate or updated')

    const parsed = new Date(pubDate)
    t.false(
      Number.isNaN(parsed.getTime()),
      `date "${pubDate}" must parse to a valid date`,
    )
  }
})

// -- URL integrity --

test('no URLs contain localhost', (t) => {
  const xml = doc.documentElement.outerHTML
  t.false(xml.includes('localhost'), 'feed must not contain localhost URLs')
})
