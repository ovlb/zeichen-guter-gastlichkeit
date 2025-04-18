import paths from './paths.js'

/**
 * Check if the image is remote and add the src assets path if not
 *
 * @param {string} orig
 * @returns {string}
 */
export default (orig) => {
  if (orig.startsWith('http')) {
    return orig
  }

  return `${paths.img}${orig.replace('^/', '')}`
}
