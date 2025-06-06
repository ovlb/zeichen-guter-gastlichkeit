import {
  absoluteUrl,
  convertHtmlToAbsoluteUrls,
} from '@11ty/eleventy-plugin-rss'
import { Podcast } from 'podcast'
import Image from '@11ty/eleventy-img'
import Fetch from '@11ty/eleventy-fetch'
import { parseBuffer } from 'music-metadata'

import siteData from '../_data/site.js'
import fullSource from '../../_helper/get-full-source.js'

class AtomFeed {
  data() {
    return {
      layout: null,
      permalink: this.metadata.feedID,
    }
  }

  get metadata() {
    return {
      title: 'Zeichen guter Gastlichkeit » Podcast',
      subtitle: 'Kultiviertes Essen und Trinken',
      feedID: 'feeds/podcast.rss',
    }
  }

  get feedURL() {
    return `${siteData.baseURL}/${this.metadata.feedID}`
  }

  audioDurationToRssDuration(durationInSeconds) {
    const minutes = Math.floor(durationInSeconds / 60)
    const seconds = (durationInSeconds % 60).toFixed(0)

    return `${minutes}:${seconds.padStart(2, '0')}`
  }

  async getFileInfo(url) {
    const fileBuffer = await Fetch(url, {
      duration: '*',
      type: 'buffer',
    })
    const parsed = await parseBuffer(fileBuffer, 'audio/mpeg', {
      duration: true,
      skipCovers: true,
    })

    return {
      fileSize: fileBuffer.length,
      duration: this.audioDurationToRssDuration(parsed.format.duration),
    }
  }

  getMusicParagraph(musicInfo) {
    if (musicInfo.isLofiGenerator) {
      return `<p>Musik generiert von <a href="https://lofigenerator.com">lofi generator</a> unter <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> Lizenz`
    }

    return `<p>Musik von ${musicInfo.artist} vom Album <a href="${musicInfo.albumLink}">${musicInfo.albumName}</a>.</p>`
  }

  async makePodcastCover() {
    const data = await Image(fullSource('/podcast-cover.jpg'), {
      formats: ['jpg'],
      widths: [1600],
      urlPath: '/feed-images/',
      outputDir: './dist/feed-images/',
    })

    return new URL(data.jpeg[0].url, siteData.baseURL).toString()
  }

  async makeImage(post) {
    const data = await Image(fullSource(post.data.podcastImage), {
      formats: ['jpg'],
      widths: [2000],
      urlPath: '/feed-images/',
      outputDir: './dist/feed-images/',
    })

    return new URL(data.jpeg[0].url, siteData.baseURL).toString()
  }

  async makeFeed() {
    const imageUrl = await this.makePodcastCover()

    return new Podcast({
      title: 'Zeichen guter Gastlichkeit',
      description: this.metadata.subtitle,
      siteUrl: siteData.baseURL,
      id: this.feedURL,
      feedUrl: this.feedURL,
      author: 'Oscar',
      copyright: 'Asbach & Co.',
      language: 'deu',
      link: this.feedURL,
      ttl: 4 * 60,
      imageUrl,
      itunesAuthor: 'Oscar',
      itunesOwner: {
        name: 'Oscar',
        email: 'itunes@m.ovlb.net',
      },
      itunesExplicit: 'no',
      itunesCategory: [
        {
          text: 'Arts',
          subcats: [{ text: 'Food' }],
        },
      ],
      categories: ['Food', 'Cooking', 'Recipes'],
      itunesImage: imageUrl,
    })
  }

  async enrichContent(post) {
    const link = `${siteData.baseURL}${post.url}`

    const episodeText = `
      <p>Alle Informationen zu Karte & Serie auf <a href="${link}">der Detailseite</a>.</p>
      ${post.templateContent ? post.templateContent : ''}
      ${this.getMusicParagraph(post.data.music)}
      <p>Zeichen guter Gastlichkeit ist eine Produktion des VEB Audioproduktionen Clara Zetkin; Berlin, DDR.</p>
      <p>Das Copyright für alle Texte und Bilder liegt bei der Weinbrennerei Asbach & Co. in Rüdesheim am Rhein.</p>
    `

    return convertHtmlToAbsoluteUrls(episodeText, siteData.baseURL)
  }

  async render({ feed: feedData, collections }) {
    const items = collections.card.filter((c) => Date.now() > c.data.date)

    const feed = await this.makeFeed(feedData, items)

    for (const post of items.toReversed()) {
      let link = absoluteUrl(post.url, siteData.baseURL)
      let file = await this.getFileInfo(post.data.audio)
      const imageUrl = await this.makeImage(post)
      const parsedContent = await this.enrichContent(post)

      feed.addItem({
        title: post.data.title,
        url: link,
        guid: link,
        itunesDuration: file.duration,
        itunesSeason: post.data.fullSeriesInfo.id,
        itunesEpisode: post.data.cardNumber,
        enclosure: {
          url: post.data.audio,
          type: 'audio/mpeg',
          size: file.fileSize,
        },
        imageUrl,
        itunesImage: imageUrl,
        description: parsedContent,
        date: post.data.date,
      })
    }

    return feed.buildXml()
  }
}

export default AtomFeed
