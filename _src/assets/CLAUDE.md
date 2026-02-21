# _src/assets/ — CSS, JavaScript, Images, Files

## CSS Pipeline

Uses PostCSS with an ITCSS-inspired layer structure. CSS is processed as a custom Eleventy template format (see `_templates/css.js`). Design tokens come from [Open Props](https://open-props.style/) — use its custom properties for sizes, colors, typography, easings, etc. instead of hardcoded values.

**CSS-first rule:** Always prefer modern, plain CSS solutions (container queries, custom properties, `:has()`, `@layer`, logical properties, `clamp()`, scroll-driven animations, view transitions, etc.) over JavaScript. Never use JS for layout, styling, or UI behavior that CSS can handle unless explicitly instructed otherwise.

`@import ''` statements must be at the top of the files or they won’t be processed by PostCSS.

### Entry Points (`.css` files in root)

Each `.css` file becomes an output at `/css/{filename}`. Pages load them via `pageCSS` frontmatter.

- `custom-properties.css` — CSS custom properties (Open Props). Must be a separate file for global availability.
- `main.css` — Base styles, imported by all pages.
- `card.css` — Card page styles.
- `home.css` — Homepage styles.
- `series.css` — Series page styles.
- `search.css` — Search page styles.

### Layer Structure (partials in subdirectories)

- `0-base/` — Resets, universal box-sizing, link styles, image constraints, aspect ratios, list styles
- `1-atoms/` — Typography (font sizes, line heights using Open Props tokens)
- `2-structures/` — Card component, ornamental frame decorations, shared page navigation (prev/next + secondary links)
- `3-pages/` — Page-specific overrides

Partials use `.pcss` extension and are imported via `@import` in entry point `.css` files.

### PostCSS Configuration

Defined in `_helper/postcss/index.js`. Plugin chain:
1. `stripInlineComments` — Custom plugin, removes `//` comments
2. `postcss-mixins` — Loads from `_helper/postcss/mixins/` (includes dark-mode mixin)
3. `@csstools/postcss-global-data` — Injects Open Props media queries
4. `postcss-import` — Resolves `@import` statements
5. `postcss-nested` — Sass-like nesting
6. `postcss-jit-props` — JIT tree-shaking for Open Props variables
7. `postcss-custom-media` — Custom media query definitions
8. `autoprefixer`

CSSO minification is available but currently disabled (`ENABLE_MINIFY = false` in `_templates/css.js`).

## JavaScript (`js/`)

TypeScript files compiled via esbuild (see `_templates/ts.js`). Output to `/js/{filename}.js`.

- `recipe-search.ts` — `<recipe-search>` custom element, Algolia-powered search
- `recipe-search-results.ts` — `<recipe-search-results>` custom element for displaying results
- `auf-gut-glueck.ts` — `<auf-gut-glueck>` custom element ("I'm feeling lucky" random recipe)
- `recipe-audio.ts` — `<recipe-audio>` custom element, vintage-styled audio player with custom controls
- `lib/` — Shared utilities

`js.11tydata.js` sets data for JS file processing.

## Images (`img/`)

Static images served via passthrough copy. Subfolders include:
- `podcast/` — Podcast cover images per card
- `feed-images/` — Images for RSS feeds
- `search/` — Thumbnail images for Algolia search results
- Card content images are generated into `dist/img/` at build time by the image transform

## Files (`files/`)

Static file downloads, copied via passthrough copy to `/files/`.
