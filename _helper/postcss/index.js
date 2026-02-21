import postcss from 'postcss'
import postcssJitProps from 'postcss-jit-props'
import OpenProps from 'open-props'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, readFileSync } from 'fs'

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

/**
 * Scans web component .ts files for var(--xxx) references and injects
 * temporary declarations so postcss-jit-props includes the tokens they need.
 * Declarations are removed in OnceExit — nothing leaks into the output.
 * @type {import('postcss').PluginCreator}
 */
const scanWebComponentTokens = () => {
  let bridgeRule = null

  return {
    postcssPlugin: 'scan-web-component-tokens',
    Once(root, { Rule, Declaration }) {
      const jsDir = join(__dirname, '../../_src/assets/js')
      const varRe = /var\(\s*(--[\w-]+)/g
      const tokens = new Set()

      const scan = (dir) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const fullPath = join(dir, entry.name)
          if (entry.isDirectory()) {
            scan(fullPath)
          } else if (entry.name.endsWith('.ts')) {
            for (const [, token] of readFileSync(fullPath, 'utf8').matchAll(
              varRe,
            )) {
              tokens.add(token)
            }
          }
        }
      }

      scan(jsDir)
      if (tokens.size === 0) return

      bridgeRule = new Rule({ selector: ':root', source: root.first?.source })
      let i = 0
      for (const token of tokens) {
        bridgeRule.append(
          new Declaration({
            prop: `--_jit-bridge-${i++}`,
            value: `var(${token})`,
            source: root.first?.source,
          }),
        )
      }
      root.prepend(bridgeRule)
    },
    OnceExit() {
      bridgeRule?.remove()
      bridgeRule = null
    },
  }
}
scanWebComponentTokens.postcss = true

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
  scanWebComponentTokens,
  postcssJitProps(OpenProps),
  customMedia,
  autoprefixer,
]

let compiler = postcss(PLUGINS)

export { PLUGINS, compiler }
