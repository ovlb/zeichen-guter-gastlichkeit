# _src/_data/ — Global Data Files

These files are available in all templates via Eleventy's data cascade.

## Files

### `site.js`
Basic metadata: `title` ("Zeichen guter Gastlichkeit"), `description`, `baseURL` (from `BASE_URL` env var).

### `build.js`
Build-time config:
- `isPreview` — true unless `PAGE_STATE=production`
- `buildTime` — timestamp of current build
- `cdnDomain` — DigitalOcean Spaces CDN for audio files
- `algoliaAppId`, `algoliaSearchKey` — from env vars, used by client-side search

### `series.js`
Master list of 25 recipe series. Each has `id` (1–25) and `name` (German). These map to card subdirectories. The series defines the taxonomy: Einkauf, Einladung, Tischordnung, Der Aperitif, Cocktails, Longdrinks, Der gedeckte Tisch, Vorspeisen, Suppen, Hausmannskost, Fischgerichte, Geflügel, etc.

### `feed.js`
RSS feed metadata: language (`de`), image paths, author info. Imports from `site.js`.

### `navigation.js`
Menu structure with `main` and `secondary` arrays. Each entry has `title` and `permalink`.

### `podcast.mjs`
Podcast platform links (Apple Podcasts, Pocket Casts, Deezer, RSS, Spotify) with IDs, names, and URLs.

### `layout.js`
Default layout for all pages: `'base'`.

## Environment Variables

Key env vars affecting data (see `.env.sample`):
- `PAGE_STATE` — `"production"` or `"development"`, gates content visibility and transforms
- `BASE_URL` — Full site URL without trailing slash, used for RSS/sitemap
- `ALGOLIA_APP_ID`, `ALGOLIA_SEARCH_API_KEY` — For client-side search
- `ALGOLIA_WRITE_API_KEY` — For build-time Algolia sync (server-side only)
- `ANTHROPIC_API_KEY` — For AI alt-text generation
