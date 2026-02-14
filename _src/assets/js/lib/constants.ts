export const RECIPES_INDEX = 'recipes'
export const DRINKS_INDEX = 'drinks'
export const DEBOUNCE_MS = 300

/** Numeric filter to exclude future posts from search results */
export function publishedFilter(): string {
  return `date <= ${Math.floor(Date.now() / 1000)}`
}

export const SEARCH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`

export const SR_ONLY_STYLES = /* css */ `
.sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`
