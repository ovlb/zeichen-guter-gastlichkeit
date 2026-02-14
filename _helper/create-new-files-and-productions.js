#!/usr/bin/env node

import { processImages } from './create-src-files-from-images.js'
import { uploadAllToAuphonic } from './upload-to-auphonic.js'
import { syncAlgoliaIndex } from './sync-algolia-index.js'

async function create() {
  await Promise.all([processImages(), uploadAllToAuphonic()])
  await syncAlgoliaIndex()
}

create()
  .then(() => {
    console.log('✅ All tasks completed successfully')
  })
  .catch((error) => {
    console.error('❌ Error:', error)
  })
