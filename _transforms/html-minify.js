import htmlmin from 'html-minifier'

export default {
  when: 'prod',
  transform: function (content) {
    if (this.outputPath && this.outputPath.endsWith('.html')) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      })

      return minified
    }

    return content
  },
}
