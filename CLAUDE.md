# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Keep all CLAUDE.md files up to date whenever you change something in the corresponding part of the codebase.**

## Project Overview

**Zeichen guter Gastlichkeit** — a German recipe card website built with Eleventy 3.x. The project digitizes 1970s-era physical recipe cards from a ring binder, making them accessible on the web. Content originates as TIFF recipe card images that are OCR'd, processed into markdown, enriched with AI-generated alt-text, and built into a static site deployed on Netlify.

## Commands

```bash
npm run serve          # Dev server at localhost:7777 with live reload
npm run build          # Production build (ELEVENTY_ENV=production)
npm run build:clean    # Clean dist/ then build
npm run lint           # All linters concurrently (CSS + JS)
npm run lint:css       # Stylelint for .pcss files (--fix)
npm run lint:js        # ESLint for .js/.ts/.vue/.mjs (--fix)
npm test               # AVA tests (_helper/__tests__/*.spec.js)
```

## Code Conventions

- **ES Modules** (`"type": "module"`) — use `import`/`export` everywhere
- **Node 22** (`.nvmrc`)
- **Conventional Commits** enforced via commitlint + husky
- **Prettier**: no semicolons, single quotes, trailing commas, arrow parens always
- **Stylelint**: properties alphabetical, custom properties before declarations
- **Environment**: copy `.env.sample` to `.env` for local development
- **Always lint and format after making changes**: run `npm run lint` after modifying `.js`/`.ts`/`.mjs`/`.pcss` files to auto-fix formatting and style issues
- **Readable code over terse code**: Prefer clear, well-structured code that reads naturally. Use descriptive names, logical grouping, and whitespace to communicate intent. Never sacrifice readability for brevity.
- **Web standards over custom solutions**: Use built-in platform APIs, native HTML attributes, and framework-provided features before writing custom logic. Examples: Eleventy's built-in filters over custom computed data, `IntersectionObserver` over scroll listeners, semantic HTML over ARIA workarounds.
- **Accessibility (WCAG AA)**: All components, templates, and scripts must conform to WCAG Level AA. Ensure sufficient color contrast, full keyboard operability, correct ARIA roles and patterns (e.g. combobox, disclosure), visible focus indicators, and meaningful text alternatives. Use native HTML elements over custom widgets wherever possible.

## Auto-Discovery Architecture

The Eleventy config (`.eleventy.js`) auto-discovers and loads modules from directories using `_helper/get-folder-exports.js`. Each directory has an `index.js` that imports all sibling `.js` files and registers them by camelCased filename. To add a new module, drop a `.js` file in the right directory — no config editing needed.

| Directory | Eleventy API | What it registers |
|-----------|-------------|-------------------|
| `_collections/` | `addCollection()` | `publishedCards`, `seriesWithEntries` |
| `_plugins/` | `addPlugin()` | RSS, sitemap, clean URLs, syntax highlight, render, content scheduling |
| `_shortcodes/` | `addShortcode()` | `navLink`, `inlineSvg`, `metaRobots` |
| `_functions/` | `addJavaScriptFunction()` | `responsiveImage` |
| `_transforms/` | `addTransform()` | HTML minify (prod), image processing |
| `_templates/` | `addTemplateFormats()` | PostCSS (.css) and esbuild (.ts) |
| `_libraries/` | `setLibrary()` | Configured markdown-it |
| `_events/` | `on('eleventy.after')` | Algolia sync, Netlify headers |

## Detailed Documentation

Each subsystem has its own CLAUDE.md:

- [`_src/CLAUDE.md`](_src/CLAUDE.md) — Content structure overview, data cascade, layouts
- [`_src/_data/CLAUDE.md`](_src/_data/CLAUDE.md) — Global data files and environment config
- [`_src/pages/CLAUDE.md`](_src/pages/CLAUDE.md) — Page templates, card content, collections, Algolia records
- [`_src/assets/CLAUDE.md`](_src/assets/CLAUDE.md) — CSS pipeline (PostCSS/ITCSS/Open Props), TypeScript web components, images
- [`_src/_includes/CLAUDE.md`](_src/_includes/CLAUDE.md) — Layouts and Nunjucks components
- [`_collections/CLAUDE.md`](_collections/CLAUDE.md) — Custom Eleventy collections
- [`_helper/CLAUDE.md`](_helper/CLAUDE.md) — Build utilities: image pipeline, AI alt-text, date logic, content scheduling, Algolia, PostCSS config, tests
- [`_plugins/CLAUDE.md`](_plugins/CLAUDE.md) — Plugin registration pattern
- [`_transforms/CLAUDE.md`](_transforms/CLAUDE.md) — HTML transforms with conditional production execution
- [`_templates/CLAUDE.md`](_templates/CLAUDE.md) — Custom template formats (PostCSS, TypeScript via esbuild)
- [`_shortcodes/CLAUDE.md`](_shortcodes/CLAUDE.md) — Nunjucks shortcodes
- [`_libraries/CLAUDE.md`](_libraries/CLAUDE.md) — Markdown-it configuration and plugins
- [`_events/CLAUDE.md`](_events/CLAUDE.md) — Build event hooks
