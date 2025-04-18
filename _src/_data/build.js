export default {
  isPreview: process.env.PAGE_STATE !== 'production',
  buildTime: new Date(),
  cdnDomain: 'https://gastlichkeit-data.fra1.cdn.digitaloceanspaces.com',
}
