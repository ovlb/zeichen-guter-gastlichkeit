import {
  absoluteUrl,
  convertHtmlToAbsoluteUrls,
  getNewestCollectionItemDate,
} from '@11ty/eleventy-plugin-rss'
import { Feed } from 'feed'

import siteData from '../_data/site.js'

class AtomFeed {
  data() {
    return {
      layout: null,
      permalink: this.metadata.feedID,
    }
  }

  get metadata() {
    return {
      title: 'Zeichen guter Gastlichkeit » Rezeptkarten',
      subtitle: 'Kultiviertes Essen und Trinken',
      feedID: 'feeds/cards.xml',
    }
  }

  get feedURL() {
    return `${siteData.baseURL}/${this.metadata.feedID}`
  }

  makeImageURL(post) {
    return new URL(post.data.feedImage, siteData.baseURL).toString()
  }

  makeFeed(baseData, collection) {
    return new Feed({
      ...baseData,
      ...this.metadata,
      id: this.feedURL,
      description: this.metadata.subtitle,
      link: this.feedURL,
      updated: getNewestCollectionItemDate(collection),
      feedLinks: {
        json: this.feedURL,
        atom: this.feedURL,
      },
    })
  }

  async enrichContent(post) {
    const parsed = await convertHtmlToAbsoluteUrls(
      post.templateContent,
      this.feedURL,
    )

    return parsed
  }

  async render({ feed: feedData, collections }) {
    const items = collections.card.filter((c) => Date.now() > c.data.date)

    const feed = this.makeFeed(feedData, items)

    for (const post of items.toReversed()) {
      let link = absoluteUrl(post.url, siteData.baseURL)

      feed.addItem({
        title: post.data.title,
        link,
        id: link,
        image: this.makeImageURL(post),
        date: post.data.date,
        ...(post.templateContent && {
          content: await this.enrichContent(post),
        }),
      })
    }

    return feed.rss2()
  }
}

export default AtomFeed
