import { isPublished } from '../_helper/content-scheduling.js'

export default {
  plugin: function (eleventyConfig) {
    eleventyConfig.addFilter('isPublished', isPublished)
  },
}
