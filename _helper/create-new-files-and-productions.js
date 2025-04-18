#!/usr/bin/env node

import { processImages } from './create-src-files-from-images.js'
import { uploadAllToAuphonic } from './upload-to-auphonic.js'

function create() {
  return Promise.all([processImages(), uploadAllToAuphonic()])
}

create()
  .then(() => {
    console.log('✅ All tasks completed successfully')
  })
  .catch((error) => {
    console.error('❌ Error:', error)
  })
