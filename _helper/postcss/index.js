import postcss from 'postcss'
import postcssJitProps from 'postcss-jit-props'
import OpenProps from 'open-props'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import mixins from 'postcss-mixins'
import globalData from '@csstools/postcss-global-data'
import pcImport from 'postcss-import'
import pcNested from 'postcss-nested'
import customMedia from 'postcss-custom-media'
import autoprefixer from 'autoprefixer'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('postcss').PluginCreator} */
const stripInlineComments = () => ({
  postcssPlugin: 'strip-inline-comments',
  Once(root) {
    root.walk((node) => {
      if (node.raws?.before) {
        node.raws.before = node.raws.before.replace(/\/\/[^\n]*/g, '')
      }
      if (node.raws?.after) {
        node.raws.after = node.raws.after.replace(/\/\/[^\n]*/g, '')
      }
    })
  },
})
stripInlineComments.postcss = true

let PLUGINS = [
  stripInlineComments,
  mixins({
    mixinsDir: join(__dirname, 'mixins/'),
  }),
  globalData({
    files: ['node_modules/open-props/src/props.media.css'],
  }),
  pcImport,
  pcNested,
  postcssJitProps(OpenProps),
  customMedia,
  autoprefixer,
]

let compiler = postcss(PLUGINS)

export { PLUGINS, compiler }
