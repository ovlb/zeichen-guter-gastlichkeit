import path from 'path'
import { readdir, stat, writeFile } from 'fs/promises'

const DIST_DIR = path.resolve(process.cwd(), 'dist')
const IMG_DIR = path.resolve(DIST_DIR, 'feed-images')

async function getLastModifiedTime(filePath) {
  const stats = await stat(filePath)
  return stats.mtime.toUTCString()
}

export default function (eleventyConfig) {
  eleventyConfig.on('eleventy.after', async ({ runMode }) => {
    if (runMode === 'build') {
      const feedImages = await readdir(IMG_DIR)

      let headers = ''

      for (const file of feedImages) {
        const filePath = path.join(IMG_DIR, file)
        const lastModified = await getLastModifiedTime(filePath)
        const relativePath = path
          .relative(DIST_DIR, filePath)
          .replace(/\\/g, '/')

        headers += `/${relativePath}\n  Last-Modified: ${lastModified}\n`
      }
      await writeFile(path.join(DIST_DIR, '_headers'), headers, 'utf8')
    }
  })
}
