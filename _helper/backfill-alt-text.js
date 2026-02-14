#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { generateAltText } from './generate-alt-text.js'

const cwd = process.cwd()
const cardsDir = path.join(cwd, '_src/pages/cards')
const imagesDir = path.join(cwd, '_src/assets/img/podcast')

async function getAllMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await getAllMarkdownFiles(fullPath)))
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return null

  return { frontmatter: match[1], body: match[2] }
}

function deriveImagePath(mdFilePath) {
  // MD: _src/pages/cards/{seriesId}/{index}-{name}.md
  // IMG: _src/assets/img/cards/{seriesId}-{index}-{name}.jpg
  const seriesId = path.basename(path.dirname(mdFilePath))
  const mdFileName = path.basename(mdFilePath, '.md')

  return path.join(imagesDir, `${seriesId}-${mdFileName}-podcast.jpg`)
}

async function backfill() {
  const mdFiles = await getAllMarkdownFiles(cardsDir)
  let updated = 0
  let skipped = 0
  let errors = 0

  console.log(`Found ${mdFiles.length} markdown files`)

  for (const mdFile of mdFiles) {
    const content = await fs.readFile(mdFile, 'utf-8')
    const parsed = parseFrontmatter(content)

    if (!parsed) {
      console.log(`⚠️ Could not parse frontmatter: ${mdFile}`)
      errors++
      continue
    }

    if (parsed.frontmatter.includes('imageAlt:')) {
      skipped++
      continue
    }

    const imagePath = deriveImagePath(mdFile)

    try {
      await fs.access(imagePath)
    } catch {
      console.log(`⚠️ Image not found: ${imagePath}`)
      errors++
      continue
    }

    try {
      const altText = await generateAltText(imagePath, {
        recipeText: parsed.body.trim(),
      })
      const newFrontmatter = `${parsed.frontmatter}\nimageAlt: "${altText}"`
      const newContent = `---\n${newFrontmatter}\n---\n${parsed.body}`

      await fs.writeFile(mdFile, newContent)
      updated++
      console.log(`✅ ${path.relative(cwd, mdFile)}: ${altText}`)
    } catch (error) {
      console.error(`❌ Error processing ${mdFile}:`, error.message)
      errors++
    }
  }

  console.log(
    `\n🎉 Done. Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`,
  )
}

backfill()
