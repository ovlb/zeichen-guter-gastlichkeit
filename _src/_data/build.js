const path = require('path')

const { version } = require(path.join(process.cwd(), 'package.json'))

module.exports = {
  isPreview: process.env.PAGE_STATE !== 'production',
  buildTime: new Date(),
  version,
  cdnDomain: 'https://gastlichkeit-data.fra1.cdn.digitaloceanspaces.com',
}
