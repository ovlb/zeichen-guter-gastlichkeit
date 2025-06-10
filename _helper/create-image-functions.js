import sharp from 'sharp'
import path from 'path'
import { getAllCardImages, srcImagesDir } from './get-all-card-images.js'

const cwd = process.cwd()

export async function createPodcastImage(sourceFileName) {
  const fileName = sourceFileName.replace('.tiff', '-podcast.jpg')
  const outputPath = path.resolve(cwd, '_src/assets/img/podcast', fileName)

  await sharp(path.resolve(srcImagesDir, sourceFileName))
    .jpeg({
      quality: 100,
    })
    .resize(2000, 2000)
    .toFile(outputPath)

  console.log(`🖼️ 🎤 Created podcast episode image for ${sourceFileName}`)
}

export async function createContentImage(sourceFileName) {
  const fileName = sourceFileName.replace('.tiff', '.jpg')
  const outputPath = path.resolve(cwd, '_src/assets/img/cards', fileName)

  await sharp(path.resolve(srcImagesDir, sourceFileName))
    .jpeg({
      quality: 100,
    })
    .resize(2000)
    .toFile(outputPath)

  console.log(`🖼️ 📔 Created content image for ${sourceFileName}`)
}

export async function createPodcastEpisodeImages() {
  const images = await getAllCardImages()

  const promises = images.map((image) => createPodcastImage(image))

  await Promise.all(promises)
}
