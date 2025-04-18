import test from 'ava'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cardsDir = path.resolve(__dirname, '../')

const EXCLUDED_FROM_DATE_TEST = [
  '2-fleisch-wild.md',
  '3-fisch.md',
  '5-getraenke.md',
  '2-bittere-appetitmacher.md',
  '3-wein-aperitifs.md',
  '4-schaumwein-aperitifs.md',
  '5-alkoholfrei.md',
  '3-cocktails-mit-asbach-uralt.md',
  '4-cocktails-mit-scotch.md',
  '6-cocktails-mit-canadian-whisky.md',
]
const EXCLUDED_FROM_WEEKEND_TEST = [
  '3-wein-aperitifs.md',
  '4-cocktails-mit-scotch.md',
]

/**
 * @typedef {Object} MarkdownData
 * @property {string} path - File path
 * @property {string[]} frontMatter - Array of frontmatter lines
 * @property {string} content - Complete file content
 */

/**
 * @typedef {Object} ProcessedDirectory
 * @property {string} folderPath - Path to the directory
 * @property {string[]} markdownFiles - List of markdown filenames
 * @property {MarkdownData[]} parsedFiles - Parsed markdown file data
 */

// File operations
const fileSystem = {
  async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8')
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`)
    }
  },

  async listFiles(dirPath) {
    try {
      return await fs.readdir(dirPath)
    } catch (error) {
      throw new Error(`Failed to read directory ${dirPath}: ${error.message}`)
    }
  },

  async isValidDirectory(dirPath, folderName) {
    try {
      const stats = await fs.stat(dirPath)
      return (
        stats.isDirectory() &&
        !folderName.startsWith('_') &&
        !folderName.startsWith('.')
      )
    } catch {
      return false
    }
  },
}

// Markdown processing
const markdown = {
  /**
   * Parses a markdown file and extracts frontmatter
   * @param {string} filePath - Path to markdown file
   * @returns {Promise<MarkdownData>} Parsed markdown data
   */
  async parse(filePath) {
    const content = await fileSystem.readFile(filePath)
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/)

    return {
      path: filePath,
      frontMatter: frontMatterMatch ? frontMatterMatch[1].split('\n') : [],
      content,
    }
  },

  /**
   * Extracts date from frontmatter line
   * @param {string} frontmatterLine - Line containing date
   * @returns {Date|null} Parsed date or null
   */
  parseDate(frontmatterLine) {
    const match = /date:\s*(.+)/.exec(frontmatterLine)
    return match ? new Date(match[1].trim()) : null
  },

  /**
   * Gets sorted markdown files from directory
   * @param {string} dirPath - Directory path
   * @returns {Promise<string[]>} Sorted list of markdown files
   */
  async getSortedFiles(dirPath) {
    const files = await fileSystem.listFiles(dirPath)
    return files
      .filter((file) => file.endsWith('.md'))
      .sort((a, b) => {
        const numA = parseInt(a.split('-')[0], 10) || 0
        const numB = parseInt(b.split('-')[0], 10) || 0
        return numA - numB
      })
  },
}

// Date utilities
const dateUtils = {
  isWeekend(date) {
    const day = date.getDay()
    return day === 0 || day === 6 // 0 is Sunday, 6 is Saturday
  },

  format(date) {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  },

  getNextBusinessDay(date) {
    const nextDate = new Date(date)
    // If Friday, skip to Monday (+3 days)
    nextDate.setDate(date.getDate() + (date.getDay() === 5 ? 3 : 1))
    return nextDate
  },
}

/**
 * Collects and processes all markdown files from subdirectories
 * @returns {Promise<ProcessedDirectory[]>} Processed directories with parsed files
 */
async function collectMarkdownFiles() {
  const results = []
  const folders = await fileSystem.listFiles(cardsDir)

  for (const folder of folders) {
    const folderPath = path.join(cardsDir, folder)

    if (!(await fileSystem.isValidDirectory(folderPath, folder))) {
      continue
    }

    const markdownFiles = await markdown.getSortedFiles(folderPath)
    if (markdownFiles.length === 0) continue

    const parsedFiles = await Promise.all(
      markdownFiles.map((file) => markdown.parse(path.join(folderPath, file))),
    )

    results.push({ folderPath, markdownFiles, parsedFiles })
  }

  return results
}

// Tests
test('All markdown files have correct frontmatter structure', async (t) => {
  const processedDirs = await collectMarkdownFiles()

  for (const { parsedFiles } of processedDirs) {
    parsedFiles.forEach((file) => {
      const fileName = path.basename(file.path)

      t.truthy(file.frontMatter?.length, `${fileName} should have frontmatter`)

      t.regex(
        file.frontMatter[0] || '',
        /^title:/,
        `${fileName} should have title as first line in frontmatter`,
      )

      t.regex(
        file.frontMatter[1] || '',
        /^date:/,
        `${fileName} should have date as second line in frontmatter`,
      )
    })
  }
})

test('Dates are valid and properly ordered', async (t) => {
  const processedDirs = await collectMarkdownFiles()

  for (const { parsedFiles } of processedDirs) {
    if (parsedFiles.length <= 1) continue

    parsedFiles.forEach((file, index) => {
      const fileName = path.basename(file.path)
      const currentDate = markdown.parseDate(file.frontMatter?.[1])

      t.truthy(currentDate, `${fileName} should have a valid date`)

      // Skip first file and excluded files
      if (index > 0 && !EXCLUDED_FROM_DATE_TEST.includes(fileName)) {
        const prevFile = parsedFiles[index - 1]
        const prevFileName = path.basename(prevFile.path)
        const prevDate = markdown.parseDate(prevFile.frontMatter?.[1])

        const expectedDate = dateUtils.getNextBusinessDay(prevDate)
        const isPrevDateFriday = prevDate.getDay() === 5

        const message = isPrevDateFriday
          ? `${fileName} should be on Monday after ${prevFileName} (Friday, ${dateUtils.format(
              prevDate,
            )}), is on ${dateUtils.format(currentDate)}`
          : `${fileName} should be one day after ${prevFileName} (${dateUtils.format(
              prevDate,
            )}) is on ${dateUtils.format(currentDate)}`

        t.deepEqual(currentDate, expectedDate, message)
      }
    })
  }
})

test('No dates fall on weekends', async (t) => {
  const processedDirs = await collectMarkdownFiles()

  for (const { parsedFiles } of processedDirs) {
    parsedFiles
      .filter(
        (file) =>
          !EXCLUDED_FROM_WEEKEND_TEST.includes(path.basename(file.path)),
      )
      .forEach((file) => {
        const fileName = path.basename(file.path)
        const currentDate = markdown.parseDate(file.frontMatter?.[1])

        if (currentDate) {
          t.false(
            dateUtils.isWeekend(currentDate),
            `${fileName} date should not be on a weekend`,
          )
        }
      })
  }
})
