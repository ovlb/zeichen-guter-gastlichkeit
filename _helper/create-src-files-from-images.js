#!/usr/bin/env node

import fs from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import slugify from '@sindresorhus/slugify'
import path from 'path'
import { fileURLToPath } from 'url'

import { fileNameRegex, getAllCardImages } from './get-all-card-images.js'
import { scanCardContent } from './scan-card-content.js'
import { dateUtils } from './date-utils.js'
import { createPodcastImage } from './create-podcast-episode-image.js'

import seriesData from '../_src/_data/series.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_FILE = path.join(__dirname, '.upload-config.json')

const uploadConfig = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'))

const cwd = process.cwd()
const outputBaseDir = path.join(cwd, '_src/pages/cards')

const LAST_DATE = new Date(uploadConfig.lastPublishDate)

const VERBOSE_LOGS = process.env.VERBOSE_LOGS === 'true'

/**
 * Creates a directory at the specified path if it doesn't exist
 * @param {string} dir - The directory path to create
 * @returns {Promise<void>}
 */
async function createDirectory(dir) {
  try {
    await fs.mkdir(dir, { recursive: true })
    console.log(`📂 Directory ${dir} created`)
  } catch (error) {
    console.error(`❌ Error creating directory ${dir}:`, error)
  }
}

/**
 * Creates an 11ty data file for the specified series
 * @param {string} seriesId - The ID of the series for which to create the data file
 * @returns {Promise<void>}
 */
async function create11tyDataFile(seriesId) {
  const data = seriesData.find((item) => item.id === parseInt(seriesId))

  if (!data) {
    console.error(`👀 Series ID «${seriesId}» not found in series data`)

    return
  }

  const fileName = `${seriesId}.11tydata.js`

  const filePath = path.join(outputBaseDir, seriesId, fileName)
  const content = `export default {
  tags: ['series:${slugify(data.name)}'],
  seriesId: ${seriesId},
  music: {
    isLofiGenerator: true,
  },
}
`
  try {
    await fs.writeFile(filePath, content)
    console.log(`🗃️ Created data file ${fileName}`)
  } catch (error) {
    console.error(`❌ Error creating file ${filePath}:`, error)
  }
}

/**
 * Processes image files to generate corresponding markdown files
 * Reads image files from source directory, extracts series and index information,
 * and creates markdown files in the output directory
 * @returns {Promise<void>}
 */
export async function processImages() {
  try {
    const imageFiles = await getAllCardImages()
    const sortedFiles = [...imageFiles].sort((a, b) => {
      const matchA = a.match(fileNameRegex)
      const matchB = b.match(fileNameRegex)

      const [, seriesIdA, indexA] = matchA
      const [, seriesIdB, indexB] = matchB

      // First compare by series
      if (seriesIdA !== seriesIdB) {
        return parseInt(seriesIdA) - parseInt(seriesIdB)
      }

      // Then by index within series
      return parseInt(indexA) - parseInt(indexB)
    })
    let lastDate = new Date(LAST_DATE)

    for (const file of sortedFiles) {
      const match = file.match(fileNameRegex)

      const [, seriesId, indexInSeries, name] = match
      const outputDir = path.join(outputBaseDir, seriesId)
      const outputFileName = `${indexInSeries}-${name}.md`
      const outputFile = path.join(outputDir, outputFileName)

      if (!existsSync(outputDir)) {
        await createDirectory(outputDir)
        await create11tyDataFile(seriesId)
      }

      try {
        await fs.access(outputFile)

        if (VERBOSE_LOGS) {
          console.log(`🙅 File ${outputFile} already exists, skipping.`)
        }
      } catch (error) {
        const [content] = await Promise.all([
          createMarkdownContent({
            indexInSeries,
            name,
            seriesId,
          }),
          createPodcastImage(file),
        ])
        const date = dateUtils.getNextBusinessDay(lastDate)

        // update to use for next card
        lastDate = date

        console.log(
          `📅 Publish date for ${
            content.title
          } (${seriesId} / ${indexInSeries}): ${dateUtils.format(date)}`,
        )
        await writeToFile(outputFile, {
          title: content.title,
          date: dateUtils.formatYYYYMMDD(date),
          text: content.text,
        })
      }
    }

    await updateNextDate(lastDate)

    console.log('🎉 Processing completed.')
  } catch (error) {
    console.error('💥 Error processing images:', error)
  }
}

/**
 * Creates markdown content for a specific item in a series.
 * Attempts to scan card content based on series ID and index.
 * Falls back to minimal content if scanning fails.
 *
 * @async
 * @param {Object} options - The options object
 * @param {number|string} options.indexInSeries - The index of the item in the series
 * @param {string} options.name - The name of the item
 * @param {string} options.seriesId - The ID of the series
 * @returns {Promise<{title: string, text: string}>} The text content object containing title and text properties
 */
export async function createMarkdownContent({ indexInSeries, name, seriesId }) {
  let textContent
  const fileName = `${seriesId}-${indexInSeries}-${name}.txt`

  try {
    textContent = await scanCardContent({
      series: seriesId,
      episode: indexInSeries,
    })

    console.log(`📝 .txt read completed for ${fileName}`)
  } catch (error) {
    console.error(`❌ Error reading .txt ${fileName}. Using fallback content.`)

    textContent = { title: name, text: '<!-- .txt no compute -->' }
  }

  return textContent
}

async function writeToFile(filePath, { title, date, text }) {
  const mdContent = `---
title: ${title}
date: ${date}
---

${text}
`
  try {
    await fs.writeFile(filePath, mdContent)
    console.log(`✅ Created file ${filePath}`)
  } catch (error) {
    console.error(`❌ Error creating file ${filePath}:`, error)
  }
}

/**
 * Updates the last publish date in the configuration file
 * @param {Date} date - The date to save as the last publish date
 * @returns {Promise<void>}
 */
async function updateNextDate(date) {
  if (date <= LAST_DATE) {
    console.log(
      `⏭️ Skipping date update: ${dateUtils.format(
        date,
      )} is not after the last publish date ${dateUtils.format(LAST_DATE)}`,
    )
    return
  }

  try {
    const updatedConfig = {
      ...uploadConfig,
      lastPublishDate: date.toISOString(),
    }
    await fs.writeFile(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2))

    console.log(`📅 Updated last publish date to ${date.toISOString()}`)
  } catch (error) {
    console.error(`❌ Error updating last publish date:`, error)
  }
}

// Run the main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processImages()
}
