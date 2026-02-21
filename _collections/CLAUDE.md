# _collections/ — Custom Eleventy Collections

## Registration Pattern

`index.js` uses `getFolderExports()` to auto-discover and register via `eleventyConfig.addCollection()`. Filename becomes the collection name (camelCased).

## Collections

### `publishedCards` (`published-cards.js`)
Pre-filtered card collection containing only cards with `date <= now` (via `isPublished()` from `_helper/content-scheduling.js`). Used by feeds, search, series pages, recipe data, and `fullSeriesInfo` in card templates. Avoids duplicating date-filtering logic across consumers.

### `seriesWithEntries` (`series-with-entries.js`)
Set of series IDs that have at least one published card. Used by `series.11ty.js` pagination to generate one series overview page per active series.

## Adding a Collection

Create a new `.js` file in this directory exporting a function that receives `collectionAPI` and returns the collection data. It will be automatically discovered and registered with the camelCased filename as the collection name.
