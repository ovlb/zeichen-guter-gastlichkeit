#!/usr/bin/env node

import {
  createContentImage,
  createFeedImage,
  createPodcastImage,
  createSearchImage,
} from './create-image-functions.js'
import { fileNameRegex, getAllCardImages } from './get-all-card-images.js'

async function recreateCardImages() {
  const imageFiles = await getAllCardImages()

  if (imageFiles.length === 0) {
    console.log('🤷 No TIFF images found in .tmp-img/')

    return
  }

  const sortedFiles = [...imageFiles].sort((a, b) => {
    const [, seriesIdA, indexA] = a.match(fileNameRegex)
    const [, seriesIdB, indexB] = b.match(fileNameRegex)

    if (seriesIdA !== seriesIdB) {
      return parseInt(seriesIdA) - parseInt(seriesIdB)
    }

    return parseInt(indexA) - parseInt(indexB)
  })

  console.log(`🖼️ Recreating image variants for ${sortedFiles.length} card(s)`)

  for (const file of sortedFiles) {
    try {
      await Promise.all([
        createPodcastImage(file),
        createSearchImage(file),
        createFeedImage(file),
        createContentImage(file),
      ])

      console.log(`✅ ${file}`)
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error)
    }
  }

  console.log('🎉 Image recreation completed.')
}

recreateCardImages().catch((error) => {
  console.error('💥 Error recreating card images:', error)
})
