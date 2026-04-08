# _events/ — Build Event Hooks

Unlike other directories, this is a single `index.js` file (not auto-discovered). It registers an `eleventy.after` event handler.

## What It Does

Runs after every build (`runMode === 'build'`):

### 1. Netlify `_headers` Update (always)
Reads all files in `dist/img/feed-images/`, generates a Netlify `_headers` file with `Last-Modified` timestamps for each feed image. This is a legacy Netlify artifact — kept temporarily until the DigitalOcean App Platform migration is verified to serve `Last-Modified` headers natively.

### 2. Algolia Index Sync (production + SYNC_ALGOLIA only)
Only runs when both conditions are true:
- `PAGE_STATE === 'production'`
- `SYNC_ALGOLIA === 'true'` (set by CI pipeline on scheduled/cron builds)

Finds `algolia-records.json` in build results, parses it, and pushes records to Algolia via `pushAlgoliaRecords()` from `_helper/sync-algolia-index.js`. This means Algolia is only updated on scheduled cron builds, not on every deploy.
