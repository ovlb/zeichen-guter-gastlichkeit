export const IS_DEV = process.env.PAGE_STATE === 'development'

export function isPublished(date) {
  if (IS_DEV) return true

  return Date.now() >= date
}
