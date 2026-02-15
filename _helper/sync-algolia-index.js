import 'dotenv/config'
import { algoliasearch } from 'algoliasearch'

const IS_PROD = process.env.PAGE_STATE === 'production'
const isLiveRun = IS_PROD

const CARDS_INDEX = 'cards'

/**
 * Configure index settings
 */
async function configureIndex(client) {
  await client.setSettings({
    indexName: CARDS_INDEX,
    indexSettings: {
      searchableAttributes: ['title', 'ingredients'],
      attributesForFaceting: ['filterOnly(date)', 'seriesName', 'type'],
      attributesToRetrieve: [
        'title',
        'parentTitle',
        'ingredients',
        'date',
        'type',
        'seriesName',
        'image',
        'imageAlt',
        'url',
      ],
      attributesToHighlight: ['title', 'ingredients'],
    },
  })
}

/**
 * Push pre-built records to Algolia indexes
 */
export async function pushAlgoliaRecords(records) {
  const appId = process.env.ALGOLIA_APP_ID
  const apiKey = process.env.ALGOLIA_WRITE_API_KEY

  if (!appId || !apiKey) {
    console.log(
      '⏭️ Skipping Algolia sync: ALGOLIA_APP_ID or ALGOLIA_WRITE_API_KEY not set',
    )
    return
  }

  const client = algoliasearch(appId, apiKey)

  console.log(`📦 Pushing ${records.length} records to "${CARDS_INDEX}" index`)

  await configureIndex(client)

  if (isLiveRun) {
    const result = records.length
      ? await client.replaceAllObjects({
          indexName: CARDS_INDEX,
          objects: records,
        })
      : undefined

    console.log(`✅ Algolia sync complete`)

    return result
  } else {
    console.log(
      `⚠️ Dry run: Algolia sync skipped. Records that would have been pushed: ${records.length}`,
    )
  }
}
