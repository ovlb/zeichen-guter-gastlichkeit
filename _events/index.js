import { pushAlgoliaRecords } from '../_helper/sync-algolia-index.js'

const IS_PROD = process.env.PAGE_STATE === 'production'
const isCronBuild = process.env.SYNC_ALGOLIA === 'true'

export default function (eleventyConfig) {
  eleventyConfig.on('eleventy.after', async ({ runMode, results }) => {
    if (runMode === 'build' && IS_PROD && isCronBuild) {
      const recordsBuildResult = results.find((r) =>
        r.url.endsWith('algolia-records.json'),
      )
      if (!recordsBuildResult) {
        console.error('❌ algolia-records.json not found in Eleventy results')
        return
      }

      const records = JSON.parse(recordsBuildResult.content)
      await pushAlgoliaRecords(records)
    }
  })
}
