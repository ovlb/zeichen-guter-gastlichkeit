const { img } = require('./paths')

/**
 * Check if the image is remote and add the src assets path if not
 *
 * @param {string} orig
 * @returns {string}
 */
module.exports = (orig) => {
  if (orig.startsWith('http')) {
    return orig
  }

  return `${img}${orig.replace('^/', '')}`
}
