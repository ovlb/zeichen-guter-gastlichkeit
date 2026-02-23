import { parseHTML } from 'linkedom'

const WC_CONFIG = new Map([
  [
    'recipe-search-results',
    { css: '/css/search-input.css', js: '/js/recipe-search-results.js' },
  ],
  [
    'recipe-search',
    { css: '/css/search-input.css', js: '/js/recipe-search.js' },
  ],
  ['auf-gut-glueck', { js: '/js/auf-gut-glueck.js' }],
])

export default {
  transform: function (content, outputPath) {
    if (outputPath && outputPath.endsWith('.html')) {
      const hasWcStyles = [...WC_CONFIG.keys()].some((tag) =>
        content.includes(`<${tag}`),
      )

      if (hasWcStyles) {
        const { document } = parseHTML(content)
        const uniqueStylePaths = new Set()
        const uniqueScriptPaths = new Set()

        const webComponents = document.querySelectorAll(
          [...WC_CONFIG.keys()].join(', '),
        )
        webComponents.forEach((component) => {
          const tagName = component.tagName.toLowerCase()
          const { css, js } = WC_CONFIG.get(tagName)

          if (css && !uniqueStylePaths.has(css)) {
            uniqueStylePaths.add(css)
            document.head.insertAdjacentHTML(
              'beforeend',
              `<link rel="preload" as="style" href="${css}" />`,
            )
          }

          if (js && !uniqueScriptPaths.has(js)) {
            uniqueScriptPaths.add(js)
            document.body.insertAdjacentHTML(
              'beforeend',
              `<script type="module" src="${js}" loading="lazy"></script>`,
            )
          }
        })

        return `<!DOCTYPE html>${document.documentElement.outerHTML}`
      }
    }

    return content
  },
}
