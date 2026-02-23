import { parseHTML } from 'linkedom'

export default {
  transform: function (content, outputPath) {
    if (outputPath && outputPath.endsWith('.html')) {
      const hasWcStyles = content.includes('data-wc-styles')

      if (hasWcStyles) {
        const { document } = parseHTML(content)
        const uniqueStylePaths = new Set()

        const styleEls = document.querySelectorAll('[data-wc-styles]')
        styleEls.forEach((styleEl) => {
          const stylePath = styleEl.getAttribute('data-wc-styles')

          if (stylePath && !uniqueStylePaths.has(stylePath)) {
            uniqueStylePaths.add(stylePath)
            document.head.insertAdjacentHTML(
              'beforeend',
              `<link rel="preload" as="style" href="${stylePath}" />`,
            )
          }
        })

        return `<!DOCTYPE html>${document.documentElement.outerHTML}`
      }
    }

    return content
  },
}
