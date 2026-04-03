import { parseHTML } from 'linkedom'

const WC_CONFIG = new Map([
  [
    'recipe-search-results',
    {
      css: ['/css/search-input.css', '/css/facets.css'],
      js: '/js/recipe-search-results.js',
    },
  ],
  [
    'recipe-search',
    { css: '/css/search-input.css', js: '/js/recipe-search.js' },
  ],
  ['auf-gut-glueck', { js: '/js/auf-gut-glueck.js' }],
  ['cookbook-button', { js: '/js/cookbook-button.js' }],
  ['cookbook-page', { js: '/js/cookbook-page.js' }],
])

export default {
  transform: function (content, outputPath) {
    if (outputPath && outputPath.endsWith('.html')) {
      const hasWcStyles = [...WC_CONFIG.keys()].some((tag) =>
        content.includes(`<${tag}`),
      )

      if (hasWcStyles) {
        const { document } = parseHTML(content)
        const cssPaths = new Set()
        const jsPaths = new Set()

        const webComponents = document.querySelectorAll(
          [...WC_CONFIG.keys()].join(', '),
        )
        webComponents.forEach((component) => {
          const tagName = component.tagName.toLowerCase()
          const { css, js } = WC_CONFIG.get(tagName)
          const entries = Array.isArray(css) ? css : css ? [css] : []
          for (const path of entries) cssPaths.add(path)
          if (js) jsPaths.add(js)
        })

        for (const path of cssPaths) {
          document.head.insertAdjacentHTML(
            'beforeend',
            `<link rel="preload" as="style" href="${path}" />`,
          )
        }

        for (const path of jsPaths) {
          document.body.insertAdjacentHTML(
            'beforeend',
            `<script type="module" src="${path}" loading="lazy"></script>`,
          )
        }

        return `<!DOCTYPE html>${document.documentElement.outerHTML}`
      }
    }

    return content
  },
}
