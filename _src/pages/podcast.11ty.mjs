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

  async makePodcastCover() {
    const data = await Image(fullSource('/podcast-cover.jpg'), {
      formats: ['jpg'],
      widths: [1600],
      urlPath: '/feed-images/',
      outputDir: './dist/feed-images/',
    })

    return absoluteUrl(data.jpeg[0].url, siteData.baseURL)
  }

  async makeImage(post) {
    const data = await Image(fullSource(post.data.image), {
      formats: ['jpg'],
      widths: [500],
      urlPath: '/feed-images/',
      outputDir: './dist/feed-images/',
    })

    return absoluteUrl(data.jpeg[0].url, siteData.baseURL)
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
      ttl: 24 * 60,
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
      itunesImage: imageUrl,
    })
  }

  async enrichContent(post) {
    const episodeText = `
      <p>Alle Informationen zu Karte & Serie: ${siteData.baseURL}${post.url}</p>
      <div>
        ${post.templateContent}
      </div>
      <p><em>Zeichen guter Gastlichkeit</em> ist eine Produktion des VEB Audioproduktionen Clara Zetkin; Berlin, DDR.</p>
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

      feed.addItem({
        title: post.data.title,
        link,
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
        date: post.data.date,
        ...(post.templateContent && {
          content: await this.enrichContent(post),
        }),
      })
    }

    return feed.buildXml()
  }
}

export default AtomFeed
