# _shortcodes/ — Nunjucks Shortcodes

`index.js` uses `getFolderExports()` to auto-discover and register via `eleventyConfig.addShortcode()`. Filename becomes the shortcode name (camelCased).

## Shortcodes

### `navLink` (`nav-link.js`)
Renders a navigation link with active state detection. Usage: `{% navLink menuItem, extraClasses %}`.

- Highlights exact matches (`menuItem.exact`) or parent routes (e.g., `/blog/post` highlights `/blog/`)
- Sets `aria-current="page"` on exact URL match
- Supports custom `attributes` and `classes` on the menu item object
- Base class: `nav__link`, active modifier: `-is-active`

### `inlineSvg` (`inline-svg.js`)
Reads an SVG file from `_src/` and injects its raw content. Usage: `{% inlineSvg "path/to/file.svg" %}`.

### `metaRobots` (`meta-robots.js`)
Outputs `<meta name="robots" content="noindex,nofollow">` unless `PAGE_STATE=production`. Used in `base-head.njk`.
