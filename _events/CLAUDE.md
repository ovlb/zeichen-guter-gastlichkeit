# _events/ — Build Event Hooks

Unlike other directories, this is a single `index.js` file (not auto-discovered). It registers an `eleventy.after` event handler.

## What It Does

Runs after every build (`runMode === 'build'`):

### 1. Netlify `_headers` Update (always)
Reads all files in `dist/img/feed-images/`, generates a Netlify `_headers` file with `Last-Modified` timestamps for each feed image. This ensures proper cache behavior for RSS feed images.

### 2. Algolia Index Sync (production cron only)
Only runs when both conditions are true:
- `PAGE_STATE === 'production'`
- `INCOMING_HOOK_TITLE === 'Cron'` (Netlify scheduled build)

Finds `algolia-records.json` in build results, parses it, and pushes records to Algolia via `pushAlgoliaRecords()` from `_helper/sync-algolia-index.js`. This means Algolia is only updated on scheduled cron builds, not on every deploy.
