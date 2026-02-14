export default {
  isPreview: process.env.PAGE_STATE !== 'production',
  buildTime: new Date(),
  cdnDomain: 'https://gastlichkeit-data.fra1.cdn.digitaloceanspaces.com',
  algoliaAppId: process.env.ALGOLIA_APP_ID || '',
  algoliaSearchKey: process.env.ALGOLIA_SEARCH_API_KEY || '',
}
