import type { SearchHit } from './lib/types.js'
import { SearchBase } from './lib/search-base.js'
import { escapeHtml, escapeAttr } from './lib/html.js'
import { DEBOUNCE_MS, SEARCH_ICON, SR_ONLY_STYLES } from './lib/constants.js'

const HITS_PER_PAGE = 20

const styles = /* css */ `
  :host {
    --_result-thumb-size: 4rem;
    --_touch-target: 2.75rem;

    color: var(--text-1);
    container-type: inline-size;
    display: block;
    font-family: inherit;
  }

  .search-header {
    margin-block-end: var(--space-m, 1.5rem);
  }

  .result-meta {
    font-size: var(--u-font-size--1, 0.875rem);
    margin-block: var(--space-xs, 0.75rem) 0;
  }

  .facets {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs, 0.5rem);
    margin-block: var(--space-xs, 0.75rem);
    margin-inline: 0;
    padding: 0;
  }

  .facet-chip {
    appearance: none;
    background: transparent;
    border: var(--border-size-1, 1px) solid var(--text-1);
    color: var(--text-1);
    cursor: pointer;
    font: inherit;
    font-size: var(--u-font-size--2, 0.8125rem);
    min-block-size: var(--_touch-target);
    padding-block: var(--space-3xs, 0.25rem);
    padding-inline: var(--space-2xs, 0.5rem);
    transition: background-color 0.15s var(--ease-3, ease), color 0.15s var(--ease-3, ease);
  }

  .facet-chip:hover {
    background: var(--accent);
    color: var(--surface-1);
  }

  .facet-chip:focus-visible {
    outline: var(--border-size-2, 2px) solid var(--link);
    outline-offset: var(--border-size-2, 2px);
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
    align-items: start;
    display: flex;
    gap: var(--space-xs, 0.75rem);
  }

  .result-thumb {
    block-size: var(--_result-thumb-size);
    flex-shrink: 0;
    inline-size: var(--_result-thumb-size);
    object-fit: cover;
  }

  .result-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--space-3xs, 0.25rem);
    min-inline-size: 0;
  }

  .result-title {
    font-family: var(--fonts-headline);
    font-size: var(--u-font-size-4);
    font-weight: var(--font-weight-7, 700);
    line-height: var(--font-lineheight-1, 1.25);
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
    outline: var(--border-size-2, 2px) solid var(--link);
    outline-offset: var(--border-size-2, 2px);
  }

  .series-badge {
    align-self: flex-start;
    background: var(--text-1);
    color: var(--surface-1);
    display: inline-block;
    font-size: var(--u-font-size--2, 0.8125rem);
    line-height: 1;
    padding-block: var(--space-3xs, 0.25rem);
    padding-inline: var(--space-2xs, 0.5rem);
    white-space: nowrap;
  }

  em {
    background: color-mix(in srgb, var(--accent) 25%, transparent);
    color: var(--text-1);
    font-style: normal;
    font-weight: var(--font-weight-7, 700);
  }

  .empty-state,
  .initial-state {
    padding-block: var(--space-l, 2rem);
    text-align: center;
  }

  .algolia-attribution {
    align-items: center;
    color: var(--accent);
    display: flex;
    font-size: var(--u-font-size--2, 0.8125rem);
    gap: var(--space-2xs, 0.5rem);
    justify-content: flex-end;
    margin-block-start: var(--space-m, 1.5rem);
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

class RecipeSearchResults extends SearchBase {
  private shadow: ShadowRoot
  private searchInput!: HTMLInputElement
  private liveRegion!: HTMLElement
  private container!: HTMLElement
  private activeFacets = new Set<string>()
  private activeType: 'recipe' | 'drink' | null = null
  private allResults: SearchHit[] = []

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  connectedCallback(): void {
    this.shadow.innerHTML = `
      <link rel="stylesheet" href="/css/search-input.css">
      <style>${styles}</style>
      <h1 class="sr-only">Rezeptsuche</h1>
      <div class="search-header">
        <div class="search-input-group">
          <span class="search-input-icon">${SEARCH_ICON}</span>
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

    const params = new URLSearchParams(window.location.search)
    const q = params.get('q') ?? ''
    const type = params.get('type')
    const series = params.get('series')

    if (q) this.searchInput.value = q
    if (type === 'recipe' || type === 'drink') this.activeType = type
    if (series) {
      for (const s of series.split(',')) this.activeFacets.add(s)
    }

    this.searchInput.addEventListener('input', this.handleInput)
    this.shadow.addEventListener('click', this.handleFacetClick)

    if (q) this.performSearch(q)
  }

  disconnectedCallback(): void {
    this.searchInput?.removeEventListener('input', this.handleInput)
    this.shadow.removeEventListener('click', this.handleFacetClick)
    super.disconnectedCallback()
  }

  // -- Events ----------------------------------------------------------------

  private handleInput = (): void => {
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer)

    this.debounceTimer = setTimeout(() => {
      const query = this.searchInput.value.trim()

      if (!query) {
        this.currentQuery = ''
        this.allResults = []
        this.activeType = null
        this.activeFacets.clear()
        this.renderResults()
        return
      }

      this.activeType = null
      this.activeFacets.clear()
      this.performSearch(query)
    }, DEBOUNCE_MS)
  }

  private handleFacetClick = (event: Event): void => {
    const target = event.target as HTMLElement
    if (!target.classList.contains('facet-chip')) return

    const type = target.dataset.type as 'recipe' | 'drink' | undefined
    if (type) {
      this.activeType = this.activeType === type ? null : type
      this.activeFacets.clear()
      this.renderResults()
      return
    }

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
    try {
      const hits = await this.executeSearch(query, HITS_PER_PAGE)
      if (!hits) return

      this.allResults = hits
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
      this.container.innerHTML =
        '<p class="initial-state">Suchbegriff eingeben</p>'
      this.updateUrl()
      return
    }

    if (this.allResults.length === 0) {
      const msg = `Keine Ergebnisse f\u00fcr \u201e${escapeHtml(
        this.currentQuery,
      )}\u201c gefunden`
      this.container.innerHTML = `<p class="empty-state">${msg}</p>`
      this.announce(msg)
      this.updateUrl()
      return
    }

    const filtered = this.getFilteredResults()
    const typeCounts = this.getTypeCounts()

    const isFiltered = this.activeType !== null || this.activeFacets.size > 0
    const countText = isFiltered
      ? `${filtered.length} von ${this.allResults.length} Ergebnissen`
      : `${this.allResults.length} Ergebnisse`

    const typeHtml = `<div class="facets" role="group" aria-label="Nach Typ filtern">
        <button class="facet-chip" data-type="recipe" aria-pressed="${
          this.activeType === 'recipe'
        }" type="button">Rezepte (${typeCounts.get('recipe') ?? 0})</button>
        <button class="facet-chip" data-type="drink" aria-pressed="${
          this.activeType === 'drink'
        }" type="button">Drinks (${typeCounts.get('drink') ?? 0})</button>
      </div>`

    const facets = this.getAvailableFacets()
    const facetHtml =
      facets.length > 0
        ? `<div class="facets" role="group" aria-label="Nach Serie filtern">
            ${facets
              .map(
                (name) =>
                  `<button class="facet-chip" data-series="${escapeAttr(
                    name,
                  )}" aria-pressed="${this.activeFacets.has(
                    name,
                  )}" type="button">${escapeHtml(name)}</button>`,
              )
              .join('')}
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
      ${typeHtml}
      ${facetHtml}
      ${resultsHtml}
      <p class="algolia-attribution">Suche bereitgestellt von <img src="/img/algolia-logo.svg" alt="Algolia" /></p>
    `
    this.updateUrl()
    this.announce(countText)
  }

  private renderHit(hit: SearchHit): string {
    const title = hit._highlightResult?.title?.value ?? escapeHtml(hit.title)

    return `
      <li class="result-item">
        <img class="result-thumb" src="${escapeAttr(
          hit.image,
        )}" alt="${escapeAttr(hit.imageAlt || hit.title)}" loading="lazy" />
        <div class="result-body">
          <h2 class="result-title"><a href="${escapeAttr(
            hit.url,
          )}">${title}</a></h2>
          <span class="series-badge">${escapeHtml(hit.seriesName)}</span>
        </div>
      </li>
    `
  }

  // -- Helpers ---------------------------------------------------------------

  private getTypeFiltered(): SearchHit[] {
    if (this.activeType === null) return this.allResults
    return this.allResults.filter((hit) => hit.type === this.activeType)
  }

  private getFilteredResults(): SearchHit[] {
    const byType = this.getTypeFiltered()
    if (this.activeFacets.size === 0) return byType
    return byType.filter((hit) => this.activeFacets.has(hit.seriesName))
  }

  private getTypeCounts(): Map<string, number> {
    const counts = new Map<string, number>()
    for (const hit of this.allResults) {
      counts.set(hit.type, (counts.get(hit.type) ?? 0) + 1)
    }
    return counts
  }

  private getAvailableFacets(): string[] {
    const names = new Set<string>()
    for (const hit of this.getTypeFiltered()) names.add(hit.seriesName)
    return [...names].sort((a, b) => a.localeCompare(b, 'de'))
  }

  private updateUrl(): void {
    const url = new URL(window.location.href)

    if (this.currentQuery) url.searchParams.set('q', this.currentQuery)
    else url.searchParams.delete('q')

    if (this.activeType) url.searchParams.set('type', this.activeType)
    else url.searchParams.delete('type')

    const series = [...this.activeFacets]
    if (series.length > 0) url.searchParams.set('series', series.join(','))
    else url.searchParams.delete('series')

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
