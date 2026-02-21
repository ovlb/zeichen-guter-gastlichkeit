# _src/pages/ — Page Templates and Card Content

## JavaScript Page Templates (11ty.js)

These are class-based templates with `data()` and `render()` methods:

- `index.11ty.js` — Homepage. Renders the series list, links to Algolia-powered `<recipe-search>` and `<auf-gut-glueck>` web components. Uses `home` layout.
- `series.11ty.js` — Series overview pages. One per series with published cards listed. Includes prev/next series navigation using shared `.page-nav` classes, with prefetch support.
- `feed.11ty.mjs` — RSS/Atom feed generation using the `feed` package.
- `podcast.11ty.js` — Podcast RSS feed.
- `algolia-records.11ty.js` — Generates `algolia-records.json` (production only). Builds search records from card collection. Drinks (series 5–6) are split into individual sub-recipe records via `##` headings. Food recipes (series 8+) get one record each with ingredients extracted from the first paragraph.
- `recipeData.11ty.js` — Outputs recipe data as JSON.
- `suche.11ty.js` — Search page.
- `hinweise.md` — Static info page ("Hinweise").

## Card Content (`cards/`)

Recipe cards organized by series: `cards/{seriesId}/{index}-{name}.md`

### Data Cascade for Cards

1. **`cards.11tydata.js`** — Shared config for all cards:
   - Tags all cards with `card`, uses `card` layout, loads `card.css`
   - `permalink` function: builds URL from series name + title slug. Returns `false` for future-dated cards in production (content scheduling).
   - `eleventyComputed`: derives `cardNumber`, `image`, `podcastImage`, `feedImage`, `audio` (CDN URL), `fullSeriesInfo` (series metadata + filtered/sorted cards)

2. **`{seriesId}/{seriesId}.11tydata.js`** — Per-series config:
   - Sets `tags` (e.g., `series:einkauf`), `seriesId`, `music` metadata (background music credits for podcast)

3. **Card frontmatter** — Per-card:
   - `title`, `date` (publish date, YYYY-MM-DD), `imageAlt` (AI-generated), `id` (UUID)
   - Optional: `part` (for multi-part cards)

### Collections

- `card` — All cards (tagged in `cards.11tydata.js`)
- `publishedCards` — Only cards with `date <= now`, pre-filtered via `isPublished()` (defined in `.eleventy.js`). Used by feeds, search, series pages, recipe data, and `fullSeriesInfo`.
- `seriesWithEntries` — Set of series IDs that have published cards (defined in `.eleventy.js`)
- `series:{slug}` — Per-series collections (tagged in per-series data files)

### Content Scheduling

Cards have auto-generated publish dates on business days (Mon–Fri). Scheduling logic lives in `_helper/content-scheduling.js` (`isPublished(date)` — returns `true` in dev, otherwise `Date.now() >= date`). The `publishedCards` collection pre-filters all cards; templates use it instead of filtering manually. The only exception is the card permalink in `cards.11tydata.js`, which uses `!IS_DEV && !this.isPublished(date)` to hide future cards in production.

### Tests

`cards/__tests__/cards.spec.mjs` — AVA tests for card data validation.
