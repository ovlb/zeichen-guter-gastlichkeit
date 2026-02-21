# _libraries/ — Markdown Configuration

`index.js` uses `getFolderExports()` to auto-discover and register via `eleventyConfig.setLibrary()`. The filename becomes the library name — `markdown.js` registers as `md`.

## `markdown.js`

Configures markdown-it with `html: true`, `breaks: true`, `linkify: true` and these plugins:

| Plugin | Purpose |
|--------|---------|
| `markdown-it-anchor` | Auto-generates anchor links on headings |
| `markdown-it-container` | Custom container blocks (configured for `featured` class: `::: featured`) |
| `markdown-it-prism` | Syntax highlighting in code blocks |
| `markdown-it-footnote` | Footnote syntax (`[^1]`) with custom HTML template |
| `markdown-it-abbr` | Abbreviation definitions (`*[HTML]: Hypertext Markup Language`) |
| `markdown-it-attribution` | Attribution blocks (`-- Author Name`) |
| `markdown-it-attrs` | Inline attribute syntax (`{.class #id}`) |
| `markdown-it-image-figures` | Wraps images in `<figure>` with `<figcaption>`, lazy loading, async decoding |

Footnotes use a customized block template with `<section class="footnotes">` and a "Footnotes" heading.

The markdown instance is also exported for reuse in other contexts (e.g., Vue components, Node scripts).
