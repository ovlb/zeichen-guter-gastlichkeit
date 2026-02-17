import sharp from 'sharp'
import path from 'path'
import { getAllCardImages, srcImagesDir } from './get-all-card-images.js'

const cwd = process.cwd()

export async function createSearchImage(sourceFileName) {
  const fileName = sourceFileName.replace('.tiff', '-search.avif')
  const outputPath = path.resolve(cwd, '_src/assets/img/search', fileName)

  await sharp(path.resolve(srcImagesDir, sourceFileName))
    .avif({
      quality: 65,
    })
    .resize(250, 250)
    .toFile(outputPath)

  console.log(`🖼️ 🔍 Created search image for ${sourceFileName}`)
}

export async function createPodcastImage(sourceFileName) {
  const fileName = sourceFileName.replace('.tiff', '-podcast.jpg')
  const outputPath = path.resolve(cwd, '_src/assets/img/podcast', fileName)

  await sharp(path.resolve(srcImagesDir, sourceFileName))
    .jpeg({
      quality: 66,
    })
    .resize(2000, 2000)
    .toFile(outputPath)

  console.log(`🖼️ 🎤 Created podcast episode image for ${sourceFileName}`)
}

export async function createFeedImage(sourceFileName) {
  const fileName = sourceFileName.replace('.tiff', '-feed.jpg')
  const outputPath = path.resolve(cwd, '_src/assets/img/feed-images/', fileName)

  await sharp(path.resolve(srcImagesDir, sourceFileName))
    .jpeg({
      quality: 66,
    })
    .resize(800)
    .toFile(outputPath)

  console.log(`🖼️ 📰 Created feed image for ${sourceFileName}`)
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
