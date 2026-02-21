# _plugins/ — Eleventy Plugins

## Registration Pattern

`index.js` uses `getFolderExports()` to auto-import all `.js` files. Each plugin file exports an object with:

```js
export default {
  plugin: theEleventyPlugin,
  pluginOptions: { /* optional config */ }
}
```

Both `plugin` and `pluginOptions` are passed to `eleventyConfig.addPlugin()`.

## Installed Plugins

- **`clean-urls.js`** — `@inframanufaktur/eleventy-plugin-clean-urls` — Removes trailing slashes from URLs
- **`rss.js`** — `@11ty/eleventy-plugin-rss` — RSS feed generation
- **`sitemap.js`** — `@quasibit/eleventy-plugin-sitemap` — Generates sitemap using `BASE_URL` env var
- **`syntax-highlight.js`** — `@11ty/eleventy-plugin-syntaxhighlight` — Code syntax highlighting
- **`render.mjs`** — `EleventyRenderPlugin` — Built-in runtime template rendering

## Adding a Plugin

Create a new `.js` file in this directory exporting `{ plugin, pluginOptions }`. It will be automatically discovered and registered.
