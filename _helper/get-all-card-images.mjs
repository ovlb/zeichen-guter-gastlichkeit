import path from 'path'
import { readdir } from 'fs/promises'

const cwd = process.cwd()
const srcImagesDir = path.join(cwd, '_src/assets/img/cards')

export const fileNameRegex = /^(\d+)-(\d+)-(.+)\.jpg$/

export async function getAllCardImages() {
  const files = await readdir(srcImagesDir)

  const imageFiles = files.filter(
    (file) => file.endsWith('.jpg') && fileNameRegex.test(file),
  )

  return imageFiles
}
