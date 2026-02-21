# _templates/ — Custom Template Formats

`index.js` auto-discovers `.js` files and registers each as an Eleventy plugin (they call `addTemplateFormats` and `addExtension` internally).

## `css.js` — PostCSS Template Handler

Registers `.css` as a custom template format. CSS files in `_src/assets/css/` become entry points.

- **Permalink**: `/css/{filename}`
- **Compilation**: Processes through the PostCSS compiler (`_helper/postcss/index.js`)
- **Dependencies**: Tracks `@import` dependencies for live reload in dev
- **Minification**: CSSO available but currently disabled (`ENABLE_MINIFY = false`)

This means `.css` files are not just copied — they're compiled through the full PostCSS pipeline.

## `ts.js` — TypeScript/esbuild Template Handler

Registers `.ts` as a custom template format. TypeScript files in `_src/assets/js/` are compiled.

- **Permalink**: `/js/{filename}.js`
- **Compilation**: esbuild with ESM format, `esnext` target, bundling enabled
- **Minification**: Enabled in production (`ELEVENTY_ENV=production`)

TypeScript files can import from other modules — esbuild handles bundling.
