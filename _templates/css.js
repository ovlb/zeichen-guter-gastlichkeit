import { minify } from 'csso'
import { compiler } from '../_helper/postcss/index.js'

const IS_PROD = process.env.ELEVENTY_ENV === 'production'
const ENABLE_MINIFY = false

export default function (eleventyConfig) {
  eleventyConfig.addTemplateFormats('css')
  eleventyConfig.addExtension('css', {
    outputFileExtension: 'css',
    compileOptions: {
      permalink: function (contents, inputPath) {
        const fileName = inputPath.split('/').pop()

        return () => {
          return `/css/${fileName}`
        }
      },
    },
    compile: async function (inputContent, inputPath) {
      const { css, messages } = await compiler.process(inputContent, {
        from: inputPath,
      })

      const dependencies = messages
        .filter((message) => message.type === 'dependency')
        .map((message) => message.file)

      if (dependencies.length) {
        this.addDependencies(inputPath, dependencies)
      }

      return () => {
        if (IS_PROD && ENABLE_MINIFY) {
          const cssoResult = minify(css)

          if (cssoResult.errors) {
            throw new Error(cssoResult.errors.join(', '))
          }

          return cssoResult.css
        }

        return css
      }
    },
  })
}
