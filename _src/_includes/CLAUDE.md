# _src/_includes/ — Layouts and Components

## Layouts (`layouts/`)

All layouts are Nunjucks templates. They share a common `<head>` via `components/core/base-head.njk`.

### `base.njk`
Default layout for most pages. Provides:
- Skip link to `#main`
- Site header with logo and nav link to home
- `<main>` with `{{ layoutClass }}` and `{{ content | safe }}`
- Footer with `end-role.njk`

### `card.njk`
Recipe card layout. Includes:
- DNS prefetch for CDN domain (`build.cdnDomain`)
- Series header showing `Serie {id}/{cardNumber}` with link to series page
- Card image with `data-process-image` attribute (triggers image transform)
- Ornamental frame wrapper
- Audio player (`<audio>` element with CDN source)
- Music credit section (handles both regular music and lofi generator credits)
- Prev/next card navigation using shared `.page-nav` classes (from `_page-nav.pcss`) with Eleventy's `getPreviousCollectionItem`/`getNextCollectionItem`/`getCollectionItemIndex` filters on `fullSeriesInfo.cards`
- `<link rel="prev">`, `<link rel="next">`, and `<link rel="prefetch">` in `<head>` for SEO and instant loading
- Series link and Start link below the card navigation (`.page-nav-secondary`)

### `home.njk`
Homepage layout. Includes:
- "Rezeptkartenserie" subtitle
- Logo and publisher info ("Weinbrennerei Asbach & Co.")
- No header nav (homepage IS the nav)

## Components (`components/`)

### `core/base-head.njk`
Shared `<head>` content:
- Meta charset, viewport
- Title: `{{ title }} – {{ site.title }}` or just `{{ site.title }}`
- Description meta tag
- Favicon
- `{% metaRobots %}` shortcode (noindex in non-production)
- Preconnect to `static.owlish.dev`
- Stylesheets: `custom-properties.css`, `main.css`, and optional `{{ pageCSS }}`
- RSS feed alternate link (`/feeds/cards.xml`)

### `core/end-role.njk`
Footer content (site-wide).

## Key Template Variables

- `title` — Page title (from frontmatter)
- `description` — Meta description
- `pageCSS` — Optional additional stylesheet filename
- `layoutClass` / `templateClass` — CSS class on `<main>`
- `content` — Rendered page content (always use `| safe` filter)
- `site`, `build`, `series`, `collections` — Global data
- Card-specific: `image`, `imageAlt`, `audio`, `fullSeriesInfo`, `cardNumber`, `music`
