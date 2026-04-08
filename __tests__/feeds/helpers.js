import { readFile, readdir } from 'fs/promises'
import path from 'path'
import { DOMParser } from 'linkedom'
import { isPublished } from '../../_helper/content-scheduling.js'
import buildData from '../../_src/_data/build.js'

const DIST_DIR = path.resolve(process.cwd(), 'dist')
const CARDS_DIR = path.resolve(process.cwd(), '_src/pages/cards')

/**
 * Read a feed file from the dist directory
 * @param {string} relativePath - path relative to dist/
 * @returns {Promise<string>}
 */
export async function readFeedFile(relativePath) {
  return readFile(path.join(DIST_DIR, relativePath), 'utf-8')
}

/**
 * Parse an XML string into a DOM document using linkedom's DOMParser.
 * Uses application/xml to correctly handle RSS/Atom elements like <link>
 * that would be treated as void elements by an HTML parser.
 * @param {string} xmlString
 * @returns {Document}
 */
export function parseFeedXml(xmlString) {
  const parser = new DOMParser()
  return parser.parseFromString(xmlString, 'application/xml')
}

/**
 * Get all elements matching a tag name (handles namespaced tags like itunes:duration)
 * @param {Document|Element} context
 * @param {string} tagName
 * @returns {Element[]}
 */
export function getAllElements(context, tagName) {
  return [...context.getElementsByTagName(tagName)]
}

/**
 * Get text content of the first matching child element.
 * Handles CDATA sections which some XML parsers expose as separate child nodes.
 * @param {Element} parent
 * @param {string} tagName
 * @returns {string|null}
 */
export function getTextContent(parent, tagName) {
  const el = parent.getElementsByTagName(tagName)[0]
  if (!el) return null

  // textContent should work for plain text and most CDATA cases
  const text = el.textContent?.trim()
  if (text) return text

  // Fallback: extract text from childNodes (handles CDATA nodes)
  let result = ''
  for (const node of el.childNodes) {
    result += node.nodeValue || node.textContent || ''
  }
  return result.trim() || null
}

/**
 * Count published cards by independently reading markdown frontmatter dates.
 * This is the source of truth for expected episode counts in feed tests.
 * @returns {Promise<number>}
 */
export async function countPublishedCards() {
  const datePattern = /^date:\s*(\d{4}-\d{2}-\d{2})/m
  let count = 0

  const seriesDirs = await readdir(CARDS_DIR, { withFileTypes: true })

  for (const dir of seriesDirs) {
    if (!dir.isDirectory()) continue

    const seriesPath = path.join(CARDS_DIR, dir.name)
    const files = await readdir(seriesPath)

    for (const file of files) {
      if (!file.endsWith('.md')) continue

      const content = await readFile(path.join(seriesPath, file), 'utf-8')
      const match = content.match(datePattern)

      if (match) {
        const date = new Date(`${match[1]}T00:00:00.000Z`)
        if (isPublished(date)) {
          count++
        }
      }
    }
  }

  return count
}

/**
 * Get the CDN domain from build data (not hardcoded)
 * @returns {string}
 */
export function getCdnDomain() {
  return buildData.cdnDomain
}
