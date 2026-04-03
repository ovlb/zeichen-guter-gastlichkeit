# _transforms/ — HTML Transforms

## Registration Pattern

`index.js` auto-discovers `.js` files and registers them via `eleventyConfig.addTransform()`. Each file exports:

```js
export default {
  when: 'prod',  // optional: only run in production (ELEVENTY_ENV=production)
  transform: function (content) { /* ... */ }
}
```

If `when` is omitted, the transform runs in all environments.

## Transforms

### `image-transform.js` (always runs)

The core image processing transform. Parses HTML output with linkedom, finds images that need processing:

1. **Opt-in images**: Elements with `data-process-image` attribute (used in card layout)
2. **Markdown content images**: All `<img>` inside `.md-content`

For each image:
- Generates responsive variants via `@11ty/eleventy-img` at widths: 680, 1024, 1400, 2000, original
- Produces AVIF + JPEG formats (WebP + GIF for animated GIFs)
- Wraps in `<picture>` element with `<source>` tags
- Sets `loading="lazy"`, `decoding="async"`, width/height attributes
- Respects per-image overrides via data attributes: `data-image-widths`, `data-image-sizes`, `data-image-formats`

### `wc-assets.js` (always runs)

Auto-injects `<script>` and `<link rel="preload">` tags for web components. Maintains a `WC_CONFIG` map of custom element tag names to their JS/CSS assets. When a page's HTML contains a registered custom element, the transform appends the corresponding `<script type="module" loading="lazy">` before `</body>` and optionally a `<link rel="preload">` in `<head>`.

Registered components: `recipe-search`, `recipe-search-results`, `auf-gut-glueck`, `cookbook-button`, `cookbook-page`.

**To add a new web component:** Add an entry to the `WC_CONFIG` map — no template changes needed.

### `html-minify.js` (production only)

Minifies HTML output using `html-minifier` with short doctype, comment removal, and whitespace collapsing. Only runs when `ELEVENTY_ENV=production` (`when: 'prod'`).
