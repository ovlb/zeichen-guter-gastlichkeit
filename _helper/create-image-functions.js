import sharp from 'sharp'
import path from 'path'
import { getAllCardImages, srcImagesDir } from './get-all-card-images.js'

const cwd = process.cwd()

export async function createPodcastImage(image) {
  const fileName = image.replace('.jpg', '-podcast.jpg')
  const outputPath = path.resolve(cwd, '_src/assets/img/podcast', fileName)

  await sharp(path.resolve(srcImagesDir, image))
    .resize(2000, 2000)
    .toFile(outputPath)

  console.log(`🖼️ 🎤 Created podcast episode image for ${image}`)
}

export async function createContentImage(imageFileName) {
  const outputPath = path.resolve(cwd, '_src/assets/img/cards', imageFileName)

  await sharp(path.resolve(srcImagesDir, imageFileName))
    .jpeg({
      quality: 100,
    })
    .resize(2000)
    .toFile(outputPath)

  console.log(`🖼️ 📔 Created content image for ${imageFileName}`)
}

export async function createPodcastEpisodeImages() {
  const images = await getAllCardImages()

  const promises = images.map((image) => createPodcastImage(image))

  await Promise.all(promises)
}
