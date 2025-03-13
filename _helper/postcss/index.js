const path = require('path')
const postcss = require('postcss')
const postcssJitProps = require('postcss-jit-props')
const OpenProps = require('open-props')

let PLUGINS = [
  require('postcss-mixins')({
    mixinsDir: path.join(__dirname, 'mixins/'),
  }),
  require('@csstools/postcss-global-data')({
    files: ['node_modules/open-props/src/props.media.css'],
  }),
  require('postcss-import'),
  require('postcss-nested'),
  postcssJitProps(OpenProps),
  require('postcss-custom-media'),
  require('autoprefixer'),
]

let compiler = postcss(PLUGINS)

module.exports = {
  PLUGINS,
  compiler,
}
