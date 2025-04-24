import fs from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEXT_DIR = join(__dirname, './.tmp-txt/')

export async function scanCardContent({ series, episode }) {
  const txtPath = join(TEXT_DIR, `${series}-${episode}.txt`)
  const textContent = await fs.readFile(txtPath, { encoding: 'utf-8' })

  const [title, ...rest] = textContent.split('\n')

  return { title, text: rest.join('\n') }
}

/**
 * Deletes all .txt files in the TEXT_DIR directory
 * @returns {Promise<number>} Number of deleted files
 */
export async function deleteAllTextFiles() {
  try {
    // Ensure directory exists before proceeding
    try {
      await fs.access(TEXT_DIR)
    } catch {
      return 0
    }

    const files = await fs.readdir(TEXT_DIR)
    const txtFiles = files.filter((file) => file.endsWith('.txt'))

    if (txtFiles.length === 0) return 0

    // Delete files with optimized concurrency
    let deletedCount = 0
    await Promise.all(
      txtFiles.map(async (file) => {
        try {
          await fs.unlink(join(TEXT_DIR, file))
          deletedCount++
        } catch (err) {
          console.error(`Failed to delete ${file}: ${err.message}`)
        }
      }),
    )

    return deletedCount
  } catch (error) {
    console.error(`Error cleaning up text files: ${error.message}`)
    return 0
  }
}
