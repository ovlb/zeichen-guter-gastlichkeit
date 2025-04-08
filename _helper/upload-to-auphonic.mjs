import { readdir, readFile } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { getAllCardImages } from './get-all-card-images.mjs'

dotenv.config()

const { AUPHONIC_API_KEY, AUPHONIC_PRESET_ID } = process.env

if (!AUPHONIC_API_KEY || !AUPHONIC_PRESET_ID) {
  throw new Error(
    'Missing required environment variables: AUPHONIC_API_KEY and/or AUPHONIC_PRESET_ID',
  )
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUDIO_DIR = join(__dirname, './.tmp-audio/')

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
 * Main function to upload all files in the audio directory to Auphonic
 */
async function uploadAllToAuphonic() {
  try {
    const audioFiles = await getFilesFromDir(AUDIO_DIR)
    const imageFiles = await getAllCardImages()

    if (audioFiles.length === 0) {
      console.log(`❌ No audio files found in ${AUDIO_DIR}`)

      return
    }

    console.log(
      `📂 Found ${audioFiles.length} ${
        audioFiles.length === 1 ? 'file' : 'files'
      } to upload...`,
    )

    for (const file of audioFiles) {
      const fileName = basename(file)
      const fileNameWithoutExt = fileName.split('.')[0]

      console.log(`📂 Processing ${fileName} …`)

      if (!imageFiles.find((img) => img.startsWith(fileNameWithoutExt))) {
        console.log(`❌ ${fileName} has no corresponding card, skipping …`)

        continue
      }

      const productionUuid = await createProduction()
      console.log(`✅ Created production: ${productionUuid}`)

      await uploadFileToAuphonic(file, productionUuid)
      console.log(
        `✅ Uploaded file \`${fileName}\` to production: ${productionUuid}`,
      )

      await startAuphonicProduction(productionUuid)
      console.log(`🚀 Started processing production: ${productionUuid}`)
    }

    console.log('🎉 All files uploaded and productions started successfully.')
  } catch (error) {
    console.error('Error processing audio files:', error)
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
