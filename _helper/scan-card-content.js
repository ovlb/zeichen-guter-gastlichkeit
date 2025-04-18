import fs from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMAGE_DIR = join(__dirname, './.tmp-txt/')

export async function scanCardContent({ series, episode }) {
  const txtPath = join(IMAGE_DIR, `${series}-${episode}.txt`)
  const textContent = await fs.readFile(txtPath, { encoding: 'utf-8' })

  const [title, ...rest] = textContent.split('\n')

  return { title, text: rest.join('\n') }
}
