# _events/ — Build Event Hooks

Unlike other directories, this is a single `index.js` file (not auto-discovered). It registers an `eleventy.after` event handler.

## What It Does

### Algolia Index Sync (production + SYNC_ALGOLIA only)
Only runs when all conditions are true:
- `runMode === 'build'`
- `PAGE_STATE === 'production'`
- `SYNC_ALGOLIA === 'true'` (set by CI pipeline on scheduled/cron builds)

Finds `algolia-records.json` in build results, parses it, and pushes records to Algolia via `pushAlgoliaRecords()` from `_helper/sync-algolia-index.js`. This means Algolia is only updated on scheduled cron builds, not on every deploy.
