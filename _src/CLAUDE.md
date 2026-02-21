# _src/ — Eleventy Source Directory

This is the Eleventy input directory. All content, data, includes, and assets live here.

## Structure

- `_data/` — Global data files available in all templates (see [`_data/CLAUDE.md`](_data/CLAUDE.md))
- `_includes/` — Layouts and Nunjucks components (see [`_includes/CLAUDE.md`](_includes/CLAUDE.md))
- `pages/` — All page content and 11ty.js page templates (see [`pages/CLAUDE.md`](pages/CLAUDE.md))
- `assets/` — CSS, JS, images, static files (see [`assets/CLAUDE.md`](assets/CLAUDE.md))
- `robots.njk` — Robots.txt template

## Template Formats

Configured in `.eleventy.js`:
- `.md` — Markdown (processed through markdown-it with Nunjucks as template engine)
- `.njk` — Nunjucks templates
- `.11ty.js` / `.11ty.mjs` — JavaScript templates (class-based with `data()` and `render()` methods)

## Layout System

Default layout is `base` (set in `_data/layout.js`). Layout aliases defined in `.eleventy.js`:
- `base` → `layouts/base.njk`
- `card` → `layouts/card.njk`
- `home` → `layouts/home.njk`

Pages can load additional CSS via `pageCSS` frontmatter variable (rendered in `base-head.njk`).
