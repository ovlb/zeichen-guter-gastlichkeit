import fs from 'fs/promises'
import { join, dirname } from 'path'
import { createWorker } from 'tesseract.js'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMAGE_DIR = join(__dirname, './.tmp-img/')

/**
 * Performs OCR on an image file using tesseract.js with German language
 * @param {string} filename - The name of the file in ./.tmp-img/ directory
 * @returns {Promise<string>} The OCR result text
 */
export async function ocrScanImage(filename) {
  try {
    const imagePath = join(IMAGE_DIR, filename)

    // Read the image file as a buffer
    const imageBuffer = await fs.readFile(imagePath)

    // Initialize tesseract worker with German language
    const worker = await createWorker('deu')

    // Recognize text in the image
    const result = await worker.recognize(imageBuffer)

    // Terminate the worker to free up resources
    await worker.terminate()

    return result.data.text
  } catch (error) {
    console.error(`Error scanning image: ${error}`)
    throw error
  }
}
