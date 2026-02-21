export const IS_PROD = process.env.PAGE_STATE === 'production'

export function isPublished(date) {
  return Date.now() >= date
}
