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

// Parse markdown file content and extract frontmatter
async function parseMarkdownFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/)

    return {
      path: filePath,
      frontMatter: frontMatterMatch ? frontMatterMatch[1].split('\n') : null,
      content,
    }
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`)
  }
}

// Check if a date falls on a weekend
function isWeekend(date) {
  const day = date.getDay()

  return day === 0 || day === 6 // 0 is Sunday, 6 is Saturday
}

// Extract and parse date from frontmatter line
function parseDate(frontmatterLine) {
  const match = /date:\s*(.+)/.exec(frontmatterLine)

  return match ? new Date(match[1].trim()) : null
}

async function getMarkdownFiles(dirPath) {
  try {
    const files = await fs.readdir(dirPath)
    return files
      .filter((file) => file.endsWith('.md'))
      .sort((a, b) => {
        // Extract numbers from the beginning of filenames
        const numA = parseInt(a.split('-')[0], 10)
        const numB = parseInt(b.split('-')[0], 10)

        return numA - numB
      })
  } catch (error) {
    throw new Error(`Failed to read directory ${dirPath}: ${error.message}`)
  }
}

// Check if a directory should be processed
async function shouldProcessDirectory(dirPath, folderName) {
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
}

async function getProcessedFiles() {
  const results = []
  const folders = await fs.readdir(cardsDir)

  for (const folder of folders) {
    const folderPath = path.join(cardsDir, folder)

    if (!(await shouldProcessDirectory(folderPath, folder))) {
      continue
    }

    const markdownFiles = await getMarkdownFiles(folderPath)

    if (markdownFiles.length === 0) continue

    // Process each markdown file
    const parsedFiles = await Promise.all(
      markdownFiles.map((file) =>
        parseMarkdownFile(path.join(folderPath, file)),
      ),
    )

    results.push({ folderPath, markdownFiles, parsedFiles })
  }

  return results
}

test('All markdown files have correct frontmatter structure', async (t) => {
  const processedDirs = await getProcessedFiles(t)

  for (const { parsedFiles } of processedDirs) {
    // Validate each file's frontmatter
    parsedFiles.forEach((parsedFile) => {
      const fileName = path.basename(parsedFile.path)

      t.truthy(parsedFile.frontMatter, `${fileName} should have frontmatter`)

      t.regex(
        parsedFile.frontMatter[0] || '',
        /^title:/,
        `${fileName} should have title as first line in frontmatter`,
      )

      t.regex(
        parsedFile.frontMatter[1] || '',
        /^date:/,
        `${fileName} should have date as second line in frontmatter`,
      )
    })
  }
})

test('Dates are valid and properly ordered', async (t) => {
  const processedDirs = await getProcessedFiles(t)

  for (const { parsedFiles } of processedDirs) {
    if (parsedFiles.length <= 1) continue

    parsedFiles.forEach((file, index) => {
      const fileName = path.basename(file.path)
      const currentDate = parseDate(file.frontMatter[1])

      t.truthy(currentDate, `${fileName} should have a valid date`)

      if (index > 0 && !EXCLUDED_FROM_DATE_TEST.includes(fileName)) {
        const prevDate = parseDate(parsedFiles[index - 1].frontMatter[1])
        const prevFileName = path.basename(parsedFiles[index - 1].path)

        t.truthy(
          prevDate,
          `Previous file ${prevFileName} should have a valid date`,
        )

        // Check if previous date is a Friday (day 5)
        const isPrevDateFriday = prevDate.getDay() === 5

        // Calculate expected next date
        const expectedDate = new Date(prevDate)
        expectedDate.setDate(prevDate.getDate() + (isPrevDateFriday ? 3 : 1))

        const intlFormatter = new Intl.DateTimeFormat('de-DE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        const formattedPrevDate = intlFormatter.format(prevDate)
        const formattedCurrDate = intlFormatter.format(currentDate)

        const message = isPrevDateFriday
          ? `${fileName} should be on Monday after ${prevFileName} (Friday, ${formattedPrevDate}), is on ${formattedCurrDate}`
          : `${fileName} should be one day after ${prevFileName} (${formattedPrevDate}) is on ${formattedCurrDate}`

        t.deepEqual(currentDate, expectedDate, message)
      }
    })
  }
})

test('No dates fall on weekends', async (t) => {
  const processedDirs = await getProcessedFiles(t)

  for (const { parsedFiles } of processedDirs) {
    const filteredFiles = parsedFiles.filter(
      (file) => !EXCLUDED_FROM_WEEKEND_TEST.includes(path.basename(file.path)),
    )

    filteredFiles.forEach((file) => {
      const fileName = path.basename(file.path)
      const currentDate = parseDate(file.frontMatter[1])

      if (currentDate) {
        t.false(
          isWeekend(currentDate),
          `${fileName} date should not be on a weekend`,
        )
      }
    })
  }
})
