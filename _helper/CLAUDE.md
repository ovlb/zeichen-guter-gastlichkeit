# _helper/ — Build Utilities

Build-time scripts and utilities. These run during content generation and the Eleventy build, not at runtime.

## Core Infrastructure

### `get-folder-exports.js`
Central to the auto-discovery architecture. Imports all `.js` files in a directory (except `index.js`), converts filenames to camelCase, and returns `[{ name, func }]` array. Used by `_plugins`, `_shortcodes`, `_functions`, `_libraries` to auto-register modules.

### `get-files.js`
Filters directory contents to return only `.js` files. Used by `get-folder-exports.js` and `_transforms/index.js`.

### `paths.js`
Centralized path constants: `static` (`_src/assets`), `files`, `css`, `js`, `img`. Used throughout the build.

### `get-full-source.js`
Resolves image paths. Remote URLs (starting with `http`) pass through; local paths get prefixed with `paths.img`. Used by image transform and responsive image function.

## Image Pipeline

The pipeline converts TIFF source images into markdown content files with multiple image variants.

### `create-src-files-from-images.js`
**Main entry point** — run directly with Node. Orchestrates the full pipeline:
1. Reads TIFF images from source via `getAllCardImages()`
2. Sorts by series ID then index
3. For each new card (skips existing):
   - Creates 4 image variants (podcast, search, feed, content) via `create-image-functions.js`
   - Reads OCR text via `scanCardContent()`
   - Generates AI alt-text via `generateAltText()` (needs the JPG to exist first)
   - Calculates next business day publish date
   - Writes markdown file with frontmatter (title, date, imageAlt, UUID)
4. Updates `.upload-config.json` with last publish date

Config file: `_helper/.upload-config.json` — stores `lastPublishDate` for incrementing.

### `get-all-card-images.js`
Finds TIFF files matching pattern `{seriesId}-{index}-{name}.tiff` in the temporary image directory.

### `create-image-functions.js`
Generates 4 image variants from each source TIFF using Sharp:
- **podcast** — For podcast covers
- **search** — Small thumbnails for Algolia search results
- **feed** — For RSS feed entries
- **content** — Main card images (JPG for the website)

### `scan-card-content.js`
Reads OCR-processed `.txt` files from `_helper/.tmp-txt/` and extracts title + text content.

## AI Integration

### `generate-alt-text.js`
Uses Claude Sonnet (`claude-sonnet-4-5-20250929`) to generate German alt-text for card images. Features:
- System prompt instructs for accessibility-focused descriptions in German
- Uses prompt caching (`cache_control: { type: 'ephemeral' }`) for efficiency
- Post-processes to convert straight quotes to typographic German quotes (`„` and `"`)
- Accepts optional recipe text for context
- Requires `ANTHROPIC_API_KEY` env var

### `backfill-alt-text.js`
Utility to regenerate missing alt-text for existing cards.

## Date Utilities

### `date-utils.js`
Business day logic for content scheduling:
- `isWeekend(date)` — Saturday/Sunday check
- `getNextBusinessDay(date)` — Skips weekends (Friday → Monday +3, Saturday → Monday +2)
- `format(date)` — German format (DD.MM.YYYY)
- `formatYYYYMMDD(date)` — ISO format for frontmatter

## Search

### `sync-algolia-index.js`
Pushes search records to Algolia. Uses `replaceAllObjects` for full index replacement. Only runs in production (`PAGE_STATE=production`). Index name: `cards`. Configures searchable attributes (title, ingredients, seriesName) and facets.

### `findMetaValue.js`
Helper for extracting metadata values.

## External Services

### `apiService.js`
Axios instance for external API calls with authorization headers from env vars.

### `upload-to-auphonic.js`
Uploads `.flac` audio files to Auphonic API for podcast audio processing. Reads from `_helper/.tmp-audio/`.

## PostCSS Configuration (`postcss/`)

### `postcss/index.js`
Configures and exports the PostCSS compiler instance. Plugin chain: stripInlineComments → mixins → globalData (Open Props media) → import → nested → jitProps → customMedia → autoprefixer.

### `postcss/mixins/`
Contains PostCSS mixin files (e.g., `dark-mode.css`).

## Tests (`__tests__/`)

AVA test files:
- `date-utils.spec.js` — Business day logic, date formatting, weekend detection
- `upload-to-auphonic.spec.js` — File filtering, File object conversion, error handling (uses temp directories)
- `findMetaValue.spec.js` — Metadata extraction

Run with `npm test`. AVA auto-discovers `*.spec.js` files.

## Temporary Directories

- `.tmp-img/` — Source TIFF images (gitignored)
- `.tmp-txt/` — OCR text files (gitignored)
- `.tmp-audio/` — FLAC audio files for Auphonic upload (gitignored)
