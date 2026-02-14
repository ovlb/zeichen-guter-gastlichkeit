import type { SearchHit } from './lib/types.js'
import { getSearchClient } from './lib/algolia-client.js'
import { escapeHtml, escapeAttr } from './lib/html.js'
import {
  RECIPES_INDEX,
  DRINKS_INDEX,
  DEBOUNCE_MS,
  SEARCH_ICON,
  SR_ONLY_STYLES,
  publishedFilter,
} from './lib/constants.js'

const HITS_PER_PAGE = 20

const styles = /* css */ `
  :host {
    --_icon-size: 1.25rem;

    container-type: inline-size;
    display: block;
    font-family: inherit;
    color: var(--text-1);
  }

  .search-header {
    margin-block-end: var(--space-m, 1.5rem);
  }

  .search-input-wrapper {
    position: relative;
  }

  .search-input {
    appearance: none;
    background: var(--surface-1);
    border: 2px solid var(--text-1);
    color: var(--text-1);
    font: inherit;
    font-size: var(--u-font-size-0, 1rem);
    inline-size: 100%;
    padding-block: var(--space-xs, 0.75rem);
    padding-inline: var(--space-s, 1rem);
    padding-inline-start: calc(var(--space-xs, 0.75rem) * 2 + var(--_icon-size));
    transition: border-color 0.15s ease, outline-color 0.15s ease;
  }

  .search-input:focus {
    border-color: var(--link);
    outline: 2px solid var(--link);
    outline-offset: 2px;
  }

  .search-input::placeholder {
    color: var(--accent);
  }

  .search-icon {
    block-size: var(--_icon-size);
    inline-size: var(--_icon-size);
    inset-block-start: 50%;
    inset-inline-start: var(--space-xs, 0.75rem);
    pointer-events: none;
    position: absolute;
    translate: 0 -50%;
  }

  .result-meta {
    font-size: var(--u-font-size--1, 0.875rem);
    margin-block: var(--space-xs, 0.75rem) 0;
  }

  .facets {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs, 0.25rem);
    margin-block: var(--space-xs, 0.75rem);
    margin-inline: 0;
    padding: 0;
  }

  .facet-chip {
    appearance: none;
    background: transparent;
    border: 1px solid var(--text-1);
    color: var(--text-1);
    cursor: pointer;
    font: inherit;
    font-size: var(--u-font-size--2, 0.8125rem);
    min-block-size: 2.75rem;
    padding-block: var(--space-3xs);
    padding-inline: var(--space-2xs);
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .facet-chip:hover {
    background: var(--accent);
    color: var(--surface-1);
  }

  .facet-chip:focus-visible {
    outline: 2px solid var(--link);
    outline-offset: 2px;
  }

  .facet-chip[aria-pressed="true"] {
    background: var(--text-1);
    border-color: var(--text-1);
    color: var(--surface-1);
  }

  .results-list {
    display: grid;
    gap: var(--space-s, 1rem);
    list-style: none;
    margin-block: 0;
    margin-inline: 0;
    padding-block: 0;
    padding-inline: 0;
  }

  .result-item {
    display: flex;
    align-items: start;
    gap: var(--space-xs, 0.75rem);
  }

  .result-thumb {
    block-size: 4rem;
    flex-shrink: 0;
    inline-size: 4rem;
    object-fit: cover;
  }

  .result-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs, 0.25rem);
    min-inline-size: 0;
    flex: 1;
  }

  .result-title {
    font-family: var(--fonts-headline);
    font-size: var(--u-font-size-4);
    font-weight: 700;
    line-height: 1.3;
    margin-block: 0;
    margin-inline: 0;
  }

  .result-title a {
    color: var(--link);
    text-decoration: none;
  }

  .result-title a:hover {
    text-decoration: underline;
  }

  .result-title a:focus-visible {
    outline: 2px solid var(--link);
    outline-offset: 2px;
  }

  .series-badge {
    background: var(--text-1);
    color: var(--surface-1);
    display: inline-block;
    font-size: var(--u-font-size--2, 0.8125rem);
    line-height: 1;
    padding-block: 0.25em;
    padding-inline: 0.6em;
    white-space: nowrap;
    align-self: flex-start;
  }

  em {
    background: color-mix(in srgb, var(--accent) 25%, transparent);
    font-style: normal;
    font-weight: 700;
    color: var(--text-1);
  }

  .empty-state,
  .initial-state {
    padding-block: var(--space-l, 2rem);
    text-align: center;
  }

  .algolia-attribution {
    display: flex;
    align-items: center;
    gap: var(--space-2xs, 0.5rem);
    justify-content: flex-end;
    margin-block-start: var(--space-m, 1.5rem);
    font-size: var(--u-font-size--2, 0.8125rem);
    color: var(--accent);
  }

  .algolia-attribution img {
    block-size: 1.25em;
    inline-size: auto;
  }

  ${SR_ONLY_STYLES}

  @container (inline-size >= 40rem) {
    .results-list {
      gap: var(--space-m, 1.5rem);
    }
  }
`

class RecipeSearchResults extends HTMLElement {
  private shadow: ShadowRoot
  private searchInput!: HTMLInputElement
  private liveRegion!: HTMLElement
  private container!: HTMLElement
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private currentQuery = ''
  private activeFacets = new Set<string>()
  private allResults: { recipes: SearchHit[]; drinks: SearchHit[] } = {
    recipes: [],
    drinks: [],
  }

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  connectedCallback(): void {
    this.shadow.innerHTML = `
      <style>${styles}</style>
      <h1 class="sr-only">Rezeptsuche</h1>
      <div class="search-header">
        <div class="search-input-wrapper">
          <span class="search-icon">${SEARCH_ICON}</span>
          <label for="search-results-input" class="sr-only">Rezeptsuche</label>
          <input
            id="search-results-input"
            class="search-input"
            type="search"
            placeholder="Rezept suchen ..."
          />
        </div>
      </div>
      <div class="results-container">
        <p class="initial-state">Suchbegriff eingeben</p>
      </div>
      <div class="sr-only" aria-live="polite" aria-atomic="true"></div>
    `

    this.searchInput = this.shadow.querySelector('.search-input')!
    this.liveRegion = this.shadow.querySelector('[aria-live]')!
    this.container = this.shadow.querySelector('.results-container')!

    const q = new URLSearchParams(window.location.search).get('q') ?? ''
    if (q) this.searchInput.value = q

    this.searchInput.addEventListener('input', this.handleInput)
    this.shadow.addEventListener('click', this.handleFacetClick)

    if (q) this.performSearch(q)
  }

  disconnectedCallback(): void {
    this.searchInput?.removeEventListener('input', this.handleInput)
    this.shadow.removeEventListener('click', this.handleFacetClick)
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer)
  }

  private get appId(): string {
    return this.getAttribute('app-id') ?? ''
  }

  private get searchKey(): string {
    return this.getAttribute('search-key') ?? ''
  }

  // -- Events ----------------------------------------------------------------

  private handleInput = (): void => {
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer)

    this.debounceTimer = setTimeout(() => {
      const query = this.searchInput.value.trim()
      this.updateUrl(query)

      if (!query) {
        this.currentQuery = ''
        this.allResults = { recipes: [], drinks: [] }
        this.activeFacets.clear()
        this.renderResults()
        return
      }

      this.performSearch(query)
    }, DEBOUNCE_MS)
  }

  private handleFacetClick = (event: Event): void => {
    const target = event.target as HTMLElement
    if (!target.classList.contains('facet-chip')) return

    const series = target.dataset.series
    if (!series) return

    if (this.activeFacets.has(series)) {
      this.activeFacets.delete(series)
    } else {
      this.activeFacets.add(series)
    }

    this.renderResults()
  }

  // -- Search ----------------------------------------------------------------

  private async performSearch(query: string): Promise<void> {
    this.currentQuery = query

    try {
      const client = await getSearchClient(this.appId, this.searchKey)
      const filters = publishedFilter()
      const { results } = await client.search<SearchHit>({
        requests: [
          { indexName: RECIPES_INDEX, query, hitsPerPage: HITS_PER_PAGE, filters },
          { indexName: DRINKS_INDEX, query, hitsPerPage: HITS_PER_PAGE, filters },
        ],
      })

      if (query !== this.currentQuery) return

      const [recipesResult, drinksResult] = results as Array<{ hits: SearchHit[] }>
      this.allResults = {
        recipes: recipesResult?.hits ?? [],
        drinks: drinksResult?.hits ?? [],
      }

      this.renderResults()
    } catch (error) {
      console.error('recipe-search-results: Search failed', error)
      this.container.innerHTML =
        '<p class="empty-state">Suche fehlgeschlagen. Bitte erneut versuchen.</p>'
      this.announce('Suche fehlgeschlagen. Bitte erneut versuchen.')
    }
  }

  // -- Rendering -------------------------------------------------------------

  private renderResults(): void {
    if (!this.currentQuery) {
      this.container.innerHTML = '<p class="initial-state">Suchbegriff eingeben</p>'
      return
    }

    const allHits = [...this.allResults.recipes, ...this.allResults.drinks]

    if (allHits.length === 0) {
      const msg = `Keine Ergebnisse f\u00fcr \u201e${escapeHtml(this.currentQuery)}\u201c gefunden`
      this.container.innerHTML = `<p class="empty-state">${msg}</p>`
      this.announce(msg)
      return
    }

    const facets = this.getAvailableFacets()
    const filtered = this.getFilteredResults()

    const countText =
      this.activeFacets.size > 0
        ? `${filtered.length} von ${allHits.length} Ergebnissen`
        : `${allHits.length} Ergebnisse`

    const facetHtml =
      facets.length > 1
        ? `<div class="facets" role="group" aria-label="Nach Serie filtern">
            ${facets.map((name) => `<button class="facet-chip" data-series="${escapeAttr(name)}" aria-pressed="${this.activeFacets.has(name)}" type="button">${escapeHtml(name)}</button>`).join('')}
          </div>`
        : ''

    const resultsHtml =
      filtered.length > 0
        ? `<ul class="results-list" role="list">
            ${filtered.map((hit) => this.renderHit(hit)).join('')}
          </ul>`
        : '<p class="empty-state">Keine Ergebnisse in dieser Auswahl</p>'

    this.container.innerHTML = `
      <p class="result-meta">${countText}</p>
      ${facetHtml}
      ${resultsHtml}
      <p class="algolia-attribution">Suche bereitgestellt von <img src="/img/algolia-logo.svg" alt="Algolia" /></p>
    `
    this.announce(countText)
  }

  private renderHit(hit: SearchHit): string {
    const title = hit._highlightResult?.title?.value ?? escapeHtml(hit.title)

    return `
      <li class="result-item">
        <img class="result-thumb" src="${escapeAttr(hit.image)}" alt="${escapeAttr(hit.imageAlt || hit.title)}" loading="lazy" />
        <div class="result-body">
          <h2 class="result-title"><a href="${escapeAttr(hit.url)}">${title}</a></h2>
          <span class="series-badge">${escapeHtml(hit.seriesName)}</span>
        </div>
      </li>
    `
  }

  // -- Helpers ---------------------------------------------------------------

  private getFilteredResults(): SearchHit[] {
    const combined = [...this.allResults.recipes, ...this.allResults.drinks]
    if (this.activeFacets.size === 0) return combined
    return combined.filter((hit) => this.activeFacets.has(hit.seriesName))
  }

  private getAvailableFacets(): string[] {
    const names = new Set<string>()
    for (const hit of this.allResults.recipes) names.add(hit.seriesName)
    for (const hit of this.allResults.drinks) names.add(hit.seriesName)
    return [...names].sort((a, b) => a.localeCompare(b, 'de'))
  }

  private updateUrl(query: string): void {
    const url = new URL(window.location.href)
    if (query) url.searchParams.set('q', query)
    else url.searchParams.delete('q')
    window.history.replaceState(null, '', url.toString())
  }

  private announce(message: string): void {
    this.liveRegion.textContent = ''
    requestAnimationFrame(() => {
      this.liveRegion.textContent = message
    })
  }
}

customElements.define('recipe-search-results', RecipeSearchResults)
