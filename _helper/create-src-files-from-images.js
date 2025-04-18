#!/usr/bin/env node

import fs from 'fs/promises'
import { existsSync } from 'fs'
import slugify from '@sindresorhus/slugify'
import path from 'path'

import { fileNameRegex, getAllCardImages } from './get-all-card-images.js'
import { scanCardContent } from './scan-card-content.js'
import seriesData from '../_src/_data/series.js'

const cwd = process.cwd()
const outputBaseDir = path.join(cwd, '_src/pages/cards')

const FIRST_NEW_DATE = new Date('2025-05-15')

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

    for (const file of imageFiles) {
      const match = file.match(fileNameRegex)

      if (!match) continue

      const [, seriesId, indexInSeries, name] = match
      const outputDir = path.join(outputBaseDir, seriesId)
      const outputFile = path.join(outputDir, `${indexInSeries}-${name}.md`)

      if (!existsSync(outputDir)) {
        await createDirectory(outputDir)
        await create11tyDataFile(seriesId)
      }

      try {
        await fs.access(outputFile)
        console.log(`🙅 File ${outputFile} already exists, skipping.`)
      } catch (error) {
        const content = await createMarkdownContent({
          indexInSeries,
          name,
          seriesId,
        })
        await fs.writeFile(outputFile, content)
        console.log(`✅ Created file ${outputFile}`)
      }
    }

    console.log('🎉 Processing completed.')
  } catch (error) {
    console.error('💥 Error processing images:', error)
  }
}

/**
 * Calculates a release date based on the provided index
 * Starts from FIRST_NEW_DATE and adds weekdays (skipping weekends)
 * @param {string} _index - The index of the card in the series
 * @returns {string} The calculated release date in YYYY-MM-DD format
 */
export function calculateReleaseDate(_index) {
  const baseDate = new Date(FIRST_NEW_DATE)
  const index = parseInt(_index, 10)

  if (index === 1) return baseDate.toISOString().split('T')[0]

  let daysAdded = 1

  while (daysAdded < index) {
    baseDate.setDate(baseDate.getDate() + 1)

    // Only count weekdays (skip Saturday and Sunday)
    if (baseDate.getDay() !== 0 && baseDate.getDay() !== 6) {
      daysAdded++
    }
  }

  return baseDate.toISOString().split('T')[0] // Returns YYYY-MM-DD
}

/**
 * Creates markdown content with cardContent for a card
 * @param {Object} params - The parameters for creating markdown content
 * @param {string} params.indexInSeries - The index of the card in the series
 * @param {string} params.name - The name of the card
 * @param {string} params.seriesId - The ID of the series the card belongs to
 * @returns {Promise<string>} The generated markdown content
 */
export async function createMarkdownContent({ indexInSeries, name, seriesId }) {
  let textContent
  const fileName = `${seriesId}-${indexInSeries}-${name}`

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

  return `---
title: ${textContent.title}
date: ${calculateReleaseDate(indexInSeries)}
---

${textContent.text}
`
}

processImages()
