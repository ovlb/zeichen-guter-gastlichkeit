const FRACTIONS = ['½', '¼', '⅛']
const COMMON_ERRORS = {
  Ol: 'Öl',
  OV: 'Öl',
  'OV/Margarine': 'Öl/Magarine',
  'EBl.': 'Eßl.',
  'V½': '½',
  V2: '½',
  '1½': '½',
  '1/½': '½',
  '21/2': '2½',
  212: '2½',
  '1¼': '¼',
  '1/¼': '¼',
  '1/8': '⅛',
  '1/⅛': '⅛',
}

const COMMON_ERROR_REGEXP = new RegExp(
  Object.keys(COMMON_ERRORS).join('|'),
  'g',
)

/**
 * @param {string} str
 */
function fixFractions(str) {
  const pattern = new RegExp(`([${FRACTIONS.join('')}]) 1`, 'g')

  return str.replace(pattern, '$1 l')
}

/**
 * @param {string} raw
 */
export function correctScanErrors(raw) {
  let text = raw

  text = text.replace(COMMON_ERROR_REGEXP, (match) => COMMON_ERRORS[match])

  return fixFractions(text).trim()
}
