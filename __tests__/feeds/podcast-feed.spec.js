import test from 'ava'
import {
  readFeedFile,
  parseFeedXml,
  getAllElements,
  getTextContent,
  countPublishedCards,
  getCdnDomain,
} from './helpers.js'

let doc
let items

test.before(async () => {
  const xml = await readFeedFile('feeds/podcast.rss')
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

  for (const field of ['title', 'description', 'link', 'language']) {
    const value = getTextContent(channel, field)
    t.truthy(value, `channel must have non-empty <${field}>`)
  }
})

test('channel has required iTunes fields', (t) => {
  const channel = doc.getElementsByTagName('channel')[0]

  const author = getTextContent(channel, 'itunes:author')
  t.truthy(author, 'channel must have <itunes:author>')

  const image = channel.getElementsByTagName('itunes:image')[0]
  t.truthy(image, 'channel must have <itunes:image>')
  t.truthy(
    image?.getAttribute('href'),
    'itunes:image must have non-empty href',
  )

  const category = channel.getElementsByTagName('itunes:category')[0]
  t.truthy(category, 'channel must have <itunes:category>')
  t.truthy(
    category?.getAttribute('text'),
    'itunes:category must have text attribute',
  )
})

// -- Data correctness --

test('episode count matches published cards', async (t) => {
  const expectedCount = await countPublishedCards()
  t.is(
    items.length,
    expectedCount,
    `expected ${expectedCount} episodes, got ${items.length}`,
  )
})

test('all GUIDs are unique', (t) => {
  const guids = items.map((item) => getTextContent(item, 'guid'))
  const uniqueGuids = new Set(guids)

  t.is(uniqueGuids.size, guids.length, 'every GUID must be unique')
})

test('every GUID is a valid URL or UUID', (t) => {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const urlPattern = /^https?:\/\//

  for (const item of items) {
    const guid = getTextContent(item, 'guid')
    t.truthy(guid, 'every item must have a GUID')
    t.true(
      urlPattern.test(guid) || uuidPattern.test(guid),
      `GUID "${guid}" must be a URL or UUID`,
    )
  }
})

// -- Per-episode data integrity --

test('every enclosure has correct CDN audio URL, type, and length', (t) => {
  const cdnDomain = getCdnDomain()
  const audioUrlPattern = new RegExp(
    `^${cdnDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/audio/.+\\.mp3$`,
  )

  for (const item of items) {
    const enclosure = item.getElementsByTagName('enclosure')[0]
    t.truthy(enclosure, 'every item must have an enclosure')

    const url = enclosure.getAttribute('url')
    t.regex(url, audioUrlPattern, `enclosure URL "${url}" must match CDN audio pattern`)

    t.is(
      enclosure.getAttribute('type'),
      'audio/mpeg',
      'enclosure type must be audio/mpeg',
    )

    const length = Number(enclosure.getAttribute('length'))
    t.true(length > 0, `enclosure length must be > 0, got ${length}`)
  }
})

test('every item has valid itunes:duration', (t) => {
  for (const item of items) {
    const duration = getTextContent(item, 'itunes:duration')
    t.truthy(duration, 'every item must have itunes:duration')
    t.regex(duration, /^\d+:\d{2}$/, `duration "${duration}" must match M:SS or MM:SS`)
  }
})

test('every item has numeric itunes:season and itunes:episode', (t) => {
  for (const item of items) {
    const season = getTextContent(item, 'itunes:season')
    t.truthy(season, 'every item must have itunes:season')
    t.false(Number.isNaN(Number(season)), `season "${season}" must be numeric`)

    const episode = getTextContent(item, 'itunes:episode')
    t.truthy(episode, 'every item must have itunes:episode')
    t.false(
      Number.isNaN(Number(episode)),
      `episode "${episode}" must be numeric`,
    )
  }
})

test('every item has itunes:image with href', (t) => {
  for (const item of items) {
    const image = item.getElementsByTagName('itunes:image')[0]
    t.truthy(image, 'every item must have itunes:image')
    t.truthy(
      image?.getAttribute('href'),
      'itunes:image must have non-empty href',
    )
  }
})

test('every item has non-empty title', (t) => {
  for (const item of items) {
    const title = getTextContent(item, 'title')
    t.truthy(title, 'every item must have a non-empty title')
  }
})

test('every item has valid pubDate', (t) => {
  for (const item of items) {
    const pubDate = getTextContent(item, 'pubDate')
    t.truthy(pubDate, 'every item must have pubDate')

    const parsed = new Date(pubDate)
    t.false(
      Number.isNaN(parsed.getTime()),
      `pubDate "${pubDate}" must parse to a valid date`,
    )
  }
})

// -- URL integrity --

test('no URLs contain localhost', (t) => {
  const xml = doc.documentElement.outerHTML
  t.false(xml.includes('localhost'), 'feed must not contain localhost URLs')
})

test('all link values use the correct base URL', (t) => {
  const baseUrl = process.env.BASE_URL

  if (!baseUrl) {
    t.log('Skipping base URL check: BASE_URL env var not set')
    t.pass()
    return
  }

  const links = getAllElements(doc, 'link')

  for (const link of links) {
    const href = link.textContent?.trim()
    if (href) {
      t.true(
        href.startsWith(baseUrl),
        `link "${href}" must start with BASE_URL "${baseUrl}"`,
      )
    }
  }
})
