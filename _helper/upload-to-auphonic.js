import { readFile, readdir } from 'fs/promises'
import { basename, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { getAllCardImages } from './get-all-card-images.js'

dotenv.config()

const { NODE_ENV, AUPHONIC_API_KEY, AUPHONIC_PRESET_ID } = process.env
const isInTest = NODE_ENV === 'test'

if (!isInTest && (!AUPHONIC_API_KEY || !AUPHONIC_PRESET_ID)) {
  throw new Error(
    'Missing required environment variables: AUPHONIC_API_KEY and/or AUPHONIC_PRESET_ID',
  )
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUDIO_DIR = join(__dirname, './.tmp-audio/')
let imageFiles = []

/**
 * Gets all files from a directory
 * @param {string} dir - Directory path
 * @returns {Promise<string[]>} Array of file paths
 */
async function getFilesFromDir(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true })

    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.flac'))
      .map((file) => join(dir, file.name))
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
    throw error
  }
}

/**
 * Creates a new production on Auphonic
 * @returns {Promise<string>} Production UUID
 */
async function createProduction() {
  const url = 'https://auphonic.com/api/productions.json'

  const jsonData = { preset: AUPHONIC_PRESET_ID }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AUPHONIC_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jsonData),
  })

  if (!response.ok) {
    throw new Error(
      `Failed to create production: ${response.status} ${response.statusText}`,
    )
  }

  const { data } = await response.json()
  return data.uuid
}

/**
 * Converts a file path to a File object compatible with FormData
 * @param {string} filePath - Path to the file
 * @returns {Promise<File>} File object
 */
async function filePathToFile(filePath) {
  const data = await readFile(filePath)
  const filename = basename(filePath)
  const extension = filename.split('.').pop().toLowerCase()

  const mimeTypes = new Map([
    ['flac', 'audio/x-flac'],
    ['wav', 'audio/wav'],
    ['ogg', 'audio/ogg'],
    ['mp3', 'audio/mpeg'],
  ])

  const mimeType = mimeTypes.get(extension) || 'audio/mpeg'

  return new File([data], filename, {
    type: mimeType,
  })
}
/**
 * Uploads a file to an Auphonic production
 * @param {string} filePath - Path to the audio file
 * @param {string} uuid - Production UUID
 * @returns {Promise<Object>} Upload result
 */
async function uploadFileToAuphonic(filePath, uuid) {
  const url = `https://auphonic.com/api/production/${uuid}/upload.json`

  const formData = new FormData()
  const fileObj = await filePathToFile(filePath)

  formData.append('input_file', fileObj)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AUPHONIC_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(
      `Failed to upload file: ${response.status} ${response.statusText}`,
    )
  }

  return response.json()
}

/**
 * Starts an Auphonic production
 * @param {string} uuid - Production UUID
 * @returns {Promise<Object>} Production status
 */
async function startAuphonicProduction(uuid) {
  const url = `https://auphonic.com/api/production/${uuid}/start.json`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AUPHONIC_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to start production (${uuid}): ${response.status} ${response.statusText}`,
    )
  }

  return response.json()
}

/**
 * Processes an audio file for upload to Auphonic if it has a corresponding image file
 *
 * This function handles:
 * - Checking for corresponding image files
 * - Creating an Auphonic production
 * - Uploading the audio file to the production
 * - Starting the production process
 * - Implementing retry logic with exponential backoff
 *
 * @async
 * @param {string} file - Path to the audio file to process
 * @returns {Promise<Object>} Processing result object
 * @returns {string} result.fileName - Name of the processed file
 * @returns {boolean} [result.skipped] - True if processing was skipped due to missing image
 * @returns {string} [result.productionUuid] - UUID of the created Auphonic production (if successful)
 * @returns {boolean} [result.success] - True if processing completed successfully
 * @returns {string} [result.error] - Error message if processing failed after all retries
 * @throws {Error} If an unexpected error occurs outside the retry mechanism
 */
async function processFile(file) {
  const fileName = basename(file)
  const fileNameWithoutExt = fileName.split('.')[0]
  const MAX_RETRIES = 2
  let retries = 0

  // Check for corresponding image
  if (!imageFiles.find((img) => img.startsWith(fileNameWithoutExt))) {
    console.log(`⏭️ ${fileName} has no corresponding card, skipping...`)
    return { fileName, skipped: true }
  }

  while (retries <= MAX_RETRIES) {
    try {
      console.log(
        `🔄 Processing ${fileName}${
          retries > 0 ? ` (retry ${retries})` : ''
        }...`,
      )

      const productionUuid = await createProduction()
      console.log(`✅ Created production: ${productionUuid} for ${fileName}`)

      await uploadFileToAuphonic(file, productionUuid)
      console.log(`📤 Uploaded ${fileName} to production: ${productionUuid}`)

      await startAuphonicProduction(productionUuid)
      console.log(`🚀 Started processing: ${productionUuid} for ${fileName}`)

      return { fileName, productionUuid, success: true }
    } catch (error) {
      retries++
      if (retries <= MAX_RETRIES) {
        const delay = Math.pow(2, retries) * 1000 // Exponential backoff
        console.warn(
          `⚠️ Error with ${fileName}, retrying in ${
            delay / 1000
          }s... (${retries}/${MAX_RETRIES})`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        console.error(
          `❌ Failed to process ${fileName} after ${MAX_RETRIES} retries:`,
          error,
        )
        return { fileName, error: error.message, success: false }
      }
    }
  }
}

/**
 * Main function to upload all files in the audio directory to Auphonic
 */
async function uploadAllToAuphonic() {
  try {
    console.time('Total execution time')
    const audioFiles = await getFilesFromDir(AUDIO_DIR)
    imageFiles = await getAllCardImages()

    if (audioFiles.length === 0) {
      console.log(`❌ No audio files found in ${AUDIO_DIR}`)
      return
    }

    console.log(
      `📂 Found ${audioFiles.length} ${
        audioFiles.length === 1 ? 'file' : 'files'
      } to upload...`,
    )

    const CONCURRENCY_LIMIT = 3
    const results = []

    for (let i = 0; i < audioFiles.length; i += CONCURRENCY_LIMIT) {
      const batch = audioFiles.slice(i, i + CONCURRENCY_LIMIT)
      const batchResults = await Promise.all(
        batch.map((file) => processFile(file)),
      )
      results.push(...batchResults)

      // Show progress
      const processed = Math.min(i + CONCURRENCY_LIMIT, audioFiles.length)
      const percent = Math.round((processed / audioFiles.length) * 100)
      console.log(
        `⏱️ Progress: ${processed}/${audioFiles.length} files (${percent}%)`,
      )
    }

    // Generate summary statistics
    const successful = results.filter((r) => r.success === true).length
    const skipped = results.filter((r) => r.skipped === true).length
    const failed = results.filter((r) => r.success === false).length

    console.log('\n📊 Summary:')
    console.log(`✅ Successfully processed: ${successful}`)
    console.log(`⏭️ Skipped: ${skipped}`)
    console.log(`❌ Failed: ${failed}`)

    if (failed > 0) {
      console.log('\n❌ Failed files:')
      failed.forEach((f) => console.log(`   - ${f.fileName}: ${f.error}`))
    }

    console.timeEnd('Total execution time')
  } catch (error) {
    console.error('🔥 Fatal error processing audio files:', error)
    process.exit(1)
  }
}

// Run the main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadAllToAuphonic()
}

export {
  getFilesFromDir,
  createProduction,
  filePathToFile,
  uploadFileToAuphonic,
  startAuphonicProduction,
  uploadAllToAuphonic,
}
