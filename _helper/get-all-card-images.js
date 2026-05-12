import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { readdir } from 'fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const IMG_DIR = path.resolve(__dirname, '.tmp-img')

export const fileNameRegex = /^(\d+)-(\d+)-(.+)\.tiff$/

export async function getAllCardImages() {
  const files = await readdir(IMG_DIR)

  const imageFiles = files.filter(
    (file) => file.endsWith('.tiff') && fileNameRegex.test(file),
  )

  return imageFiles
}
