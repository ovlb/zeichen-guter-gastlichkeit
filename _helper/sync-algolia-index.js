import 'dotenv/config'
import { algoliasearch } from 'algoliasearch'

const IS_PROD = process.env.PAGE_STATE === 'production'
const isLiveRun = IS_PROD

const RECIPE_INDEX = 'recipes'
const DRINKS_INDEX = 'drinks'

/**
 * Configure index settings
 */
async function configureIndex(client, indexName) {
  await client.setSettings({
    indexName,
    indexSettings: {
      searchableAttributes: ['title', 'ingredients'],
      attributesForFaceting: ['filterOnly(date)', 'seriesName'],
      attributesToRetrieve: [
        'title',
        'parentTitle',
        'ingredients',
        'date',
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
export async function pushAlgoliaRecords({ recipes, drinks }) {
  const appId = process.env.ALGOLIA_APP_ID
  const apiKey = process.env.ALGOLIA_WRITE_API_KEY

  if (!appId || !apiKey) {
    console.log(
      '⏭️ Skipping Algolia sync: ALGOLIA_APP_ID or ALGOLIA_WRITE_API_KEY not set',
    )
    return
  }

  const client = algoliasearch(appId, apiKey)

  console.log(
    `📦 Pushing ${recipes.length} recipe records, ${drinks.length} drink records`,
  )

  // Configure indexes
  await Promise.all([
    configureIndex(client, RECIPE_INDEX),
    configureIndex(client, DRINKS_INDEX),
  ])

  if (isLiveRun) {
    // Save records (replaceAllObjects = full replace)
    const results = await Promise.all([
      recipes.length
        ? client.replaceAllObjects({
            indexName: RECIPE_INDEX,
            objects: recipes,
          })
        : Promise.resolve(),
      drinks.length
        ? client.replaceAllObjects({ indexName: DRINKS_INDEX, objects: drinks })
        : Promise.resolve(),
    ])

    console.log(`✅ Algolia sync complete`)

    return results
  } else {
    console.log(
      `⚠️ Dry run: Algolia sync skipped. Records that would have been pushed: ${recipes.length} recipes, ${drinks.length} drinks`,
    )
  }
}
