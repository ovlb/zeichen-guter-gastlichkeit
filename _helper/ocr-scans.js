import { ocr } from 'mac-ocr'
import { dirname, join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { TEXT_DIR } from './scan-card-content.js'
import { correctScanErrors } from './text-utils/correct-scan-errors.js'
import getFilesOfType from './get-files.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const SCAN_DIR = join(__dirname, './.tmp-scans/')

const scanOptions = {
  languages: ['de-DE'],
}

export async function createTxtFromOcr({ series, card }) {
  const file = await readFile(join(SCAN_DIR, `${series}-${card}.jpeg`))

  if (!file) {
    throw `File to OCR for ${series}/${card} does not exist`
  }

  const scanResult = await ocr(file, scanOptions)
  const txtFilePath = join(TEXT_DIR, `${series}-${card}.txt`)

  const normalizedText = correctScanErrors(scanResult.text)

  await writeFile(txtFilePath, normalizedText)
  console.log(`✏️ Scanned card text for ${series}/${card}`)
}

async function main() {
  const scans = getFilesOfType(SCAN_DIR, '.jpeg')

  for (const scan of scans) {
    const data = scan.replace('.jpeg', '')
    const [series, card] = data.split('-')

    await createTxtFromOcr({ series, card })
  }
}

// Run the main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
