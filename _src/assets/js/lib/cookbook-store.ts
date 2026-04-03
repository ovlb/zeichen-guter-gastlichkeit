const STORAGE_KEY = 'cookbook'
const DRINK_SERIES = new Set([5, 6])

export interface CookbookEntry {
  url: string
  title: string
  sources: Array<{ type: string; srcset: string }>
  imgSrc: string
  imgWidth: number
  imgHeight: number
  imageAlt: string
  seriesName: string
  seriesId: number
  cardNumber: number
  type: 'recipe' | 'drink'
}

export function getAll(): CookbookEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function save(entry: CookbookEntry): void {
  const entries = getAll()
  if (entries.some((e) => e.url === entry.url)) return
  entries.push(entry)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Storage quota exceeded — silently fail
  }
}

export function remove(url: string): void {
  const entries = getAll().filter((e) => e.url !== url)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Storage quota exceeded — silently fail
  }
}

export function has(url: string): boolean {
  return getAll().some((e) => e.url === url)
}

export function entryType(seriesId: number): 'recipe' | 'drink' {
  return DRINK_SERIES.has(seriesId) ? 'drink' : 'recipe'
}
