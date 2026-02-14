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

const LISTBOX_ID = 'rs-listbox'
const OPTION_PREFIX = 'rs-option-'
const MAX_RESULTS = 3

const styles = /* css */ `
  :host {
    --_icon-size: 1.125em;

    display: block;
    position: relative;
    font-family: inherit;
  }

  .combobox-wrapper {
    position: relative;
  }

  .input-wrapper {
    position: relative;
  }

  .search-icon {
    position: absolute;
    inset-inline-start: var(--space-xs, 0.75rem);
    inset-block-start: 50%;
    translate: 0 -50%;
    pointer-events: none;
    color: var(--accent);
    inline-size: var(--_icon-size);
    block-size: var(--_icon-size);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .search-icon svg {
    inline-size: 100%;
    block-size: 100%;
  }

  input[type="search"] {
    inline-size: 100%;
    padding-block: var(--space-xs, 0.75rem);
    padding-inline: var(--space-xs, 0.75rem);
    padding-inline-start: calc(var(--space-xs, 0.75rem) * 2 + var(--_icon-size));
    border: 2px solid var(--text-1);
    background: var(--surface-1);
    color: var(--text-1);
    font-size: var(--u-font-size-0, 1rem);
    font-family: inherit;
    line-height: 1.5;
    outline: none;
    transition: border-color 0.15s ease, outline-color 0.15s ease;
    -webkit-appearance: none;
    appearance: none;
  }

  input[type="search"]:focus {
    border-color: var(--link);
    outline: 2px solid var(--link);
    outline-offset: 2px;
  }

  input[type="search"]::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
  }

  .listbox {
    position: absolute;
    inset-inline: 0;
    inset-block-start: 100%;
    margin-block-start: var(--space-3xs, 0.25rem);
    padding: var(--space-3xs, 0.25rem);
    list-style: none;
    background: var(--surface-1);
    border: 1px solid var(--text-1);
    box-shadow:
      0 4px 12px color-mix(in srgb, var(--text-1) 8%, transparent),
      0 2px 4px color-mix(in srgb, var(--text-1) 4%, transparent);
    z-index: 100;
    max-block-size: 24rem;
    overflow-block: auto;
    overscroll-behavior: contain;
  }

  .listbox[hidden] {
    display: none;
  }

  .option {
    display: flex;
    align-items: center;
    gap: var(--space-xs, 0.75rem);
    padding-block: var(--space-2xs, 0.5rem);
    padding-inline: var(--space-xs, 0.75rem);
    cursor: pointer;
    color: var(--text-1);
    transition: background-color 0.15s ease;
  }

  .option[aria-selected="true"] {
    background-color: color-mix(in srgb, var(--accent) 12%, var(--surface-1));
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .option:hover {
    background-color: color-mix(in srgb, var(--accent) 8%, var(--surface-1));
  }

  .option-thumb {
    inline-size: 2.75rem;
    block-size: 2.75rem;
    object-fit: cover;
    flex-shrink: 0;
    background-color: var(--surface-1);
  }

  .option-text {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs, 0.25rem);
    min-inline-size: 0;
  }

  .option-title {
    font-size: var(--u-font-size--1, 0.9375rem);
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .option-title mark,
  .option-title em {
    background: color-mix(in srgb, var(--accent) 25%, transparent);
    font-style: normal;
    font-weight: 700;
    color: var(--text-1);
  }

  .option-series {
    font-size: var(--u-font-size--2, 0.75rem);
    line-height: 1.3;
    color: var(--accent);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .show-all-link {
    display: block;
    padding-block: var(--space-xs, 0.75rem);
    border-block-start: 1px solid color-mix(in srgb, var(--accent) 15%, transparent);
    font-size: var(--u-font-size--1, 0.875rem);
    font-weight: 600;
    color: var(--link);
    text-align: center;
    text-decoration: none;
  }

  .show-all-link:hover {
    color: var(--text-1);
  }

  .show-all-link:focus-visible {
    outline: 2px solid var(--link);
    outline-offset: -2px;
  }

  .show-all-link[hidden] {
    display: none;
  }

  ${SR_ONLY_STYLES}
`

class RecipeSearch extends HTMLElement {
  private shadow: ShadowRoot
  private input!: HTMLInputElement
  private listbox!: HTMLUListElement
  private liveRegion!: HTMLDivElement
  private showAllLink!: HTMLAnchorElement
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private activeIndex = -1
  private hits: SearchHit[] = []
  private currentQuery = ''
  private isOpen = false

  private handleDocumentClick = (event: MouseEvent) => {
    if (!event.composedPath().includes(this)) {
      this.close()
    }
  }

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  connectedCallback(): void {
    this.shadow.innerHTML = `
      <style>${styles}</style>
      <div class="combobox-wrapper">
        <div class="input-wrapper">
          <span class="search-icon">${SEARCH_ICON}</span>
          <input
            type="search"
            role="combobox"
            aria-expanded="false"
            aria-controls="${LISTBOX_ID}"
            aria-activedescendant=""
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-label="Rezeptsuche"
            placeholder="Rezept suchen\u2026"
            autocomplete="off"
            spellcheck="false"
          />
        </div>
        <ul role="listbox" id="${LISTBOX_ID}" class="listbox" hidden></ul>
        <a class="show-all-link" hidden></a>
        <div aria-live="polite" class="sr-only"></div>
      </div>
    `

    this.input = this.shadow.querySelector('input')!
    this.listbox = this.shadow.querySelector(`#${LISTBOX_ID}`)!
    this.showAllLink = this.shadow.querySelector('.show-all-link')!
    this.liveRegion = this.shadow.querySelector('[aria-live]')!

    this.input.addEventListener('focus', this.handleFocus)
    this.input.addEventListener('input', this.handleInput)
    this.input.addEventListener('keydown', this.handleKeydown)
    document.addEventListener('click', this.handleDocumentClick)
  }

  disconnectedCallback(): void {
    document.removeEventListener('click', this.handleDocumentClick)
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer)
  }

  private get appId(): string {
    return this.getAttribute('app-id') ?? ''
  }

  private get searchKey(): string {
    return this.getAttribute('search-key') ?? ''
  }

  // -- Events ----------------------------------------------------------------

  private handleFocus = (): void => {
    getSearchClient(this.appId, this.searchKey)
  }

  private handleInput = (): void => {
    const query = this.input.value.trim()
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer)

    if (!query) {
      this.clearResults()
      return
    }

    this.debounceTimer = setTimeout(() => {
      void this.search(query)
    }, DEBOUNCE_MS)
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    const count = this.getOptionCount()

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (event.altKey) {
          this.openIfHasHits(0)
        } else {
          this.openIfHasHits()
          if (this.isOpen)
            this.setActiveIndex(
              this.activeIndex >= count - 1 ? 0 : this.activeIndex + 1,
            )
        }
        break

      case 'ArrowUp':
        event.preventDefault()
        if (event.altKey) {
          this.close()
        } else {
          this.openIfHasHits()
          if (this.isOpen)
            this.setActiveIndex(
              this.activeIndex <= 0 ? count - 1 : this.activeIndex - 1,
            )
        }
        break

      case 'Home':
        if (this.isOpen && count > 0) {
          event.preventDefault()
          this.setActiveIndex(0)
        }
        break

      case 'End':
        if (this.isOpen && count > 0) {
          event.preventDefault()
          this.setActiveIndex(count - 1)
        }
        break

      case 'Enter':
        event.preventDefault()
        if (this.isOpen && this.activeIndex >= 0)
          this.selectOption(this.activeIndex)
        else if (this.input.value.trim())
          this.navigateToSearch(this.input.value.trim())
        break

      case 'Escape':
        if (this.isOpen) {
          event.preventDefault()
          this.close()
          this.input.value = ''
          this.clearResults()
        } else if (this.input.value) {
          event.preventDefault()
          this.input.value = ''
          this.clearResults()
        } else this.input.blur()
        break

      case 'Tab':
        this.close()
        break
    }
  }

  // -- Search ----------------------------------------------------------------

  private async search(query: string): Promise<void> {
    this.currentQuery = query

    try {
      const client = await getSearchClient(this.appId, this.searchKey)
      const filters = publishedFilter()
      const { results } = await client.search<SearchHit>({
        requests: [
          {
            indexName: RECIPES_INDEX,
            query,
            hitsPerPage: MAX_RESULTS,
            filters,
          },
          { indexName: DRINKS_INDEX, query, hitsPerPage: MAX_RESULTS, filters },
        ],
      })

      if (query !== this.currentQuery) return

      const hits: SearchHit[] = []
      for (const r of results as Array<{ hits: SearchHit[] }>) {
        for (const hit of r.hits) {
          if (hits.length >= MAX_RESULTS) break
          hits.push(hit)
        }
        if (hits.length >= MAX_RESULTS) break
      }

      this.hits = hits
      this.renderResults()
      this.open()
      this.liveRegion.textContent =
        hits.length === 0
          ? 'Keine Ergebnisse gefunden.'
          : `${hits.length} ${
              hits.length === 1 ? 'Ergebnis' : 'Ergebnisse'
            } gefunden.`
    } catch (error) {
      console.error('[recipe-search] Search failed:', error)
      this.clearResults()
    }
  }

  // -- Rendering -------------------------------------------------------------

  private renderResults(): void {
    const fragment = document.createDocumentFragment()

    this.hits.forEach((hit, index) => {
      const li = document.createElement('li')
      li.setAttribute('role', 'option')
      li.setAttribute('id', `${OPTION_PREFIX}${index}`)
      li.setAttribute('aria-selected', 'false')
      li.classList.add('option')
      li.dataset.url = hit.url

      const title = hit._highlightResult?.title?.value ?? escapeHtml(hit.title)
      const thumb = `<img class="option-thumb" src="${escapeAttr(
        hit.image,
      )}" alt="${escapeAttr(hit.imageAlt || hit.title)}" loading="lazy" />`
      const series = `<span class="option-series">${escapeHtml(
        hit.seriesName,
      )}</span>`

      li.innerHTML = `
        ${thumb}
        <span class="option-text">
          <span class="option-title">${title}</span>
          ${series}
        </span>
      `

      li.addEventListener('mouseenter', () => this.setActiveIndex(index))
      li.addEventListener('click', () => window.location.assign(hit.url))
      fragment.appendChild(li)
    })

    this.listbox.replaceChildren(fragment)
    this.activeIndex = -1
    this.updateActiveDescendant()

    this.showAllLink.href = `/suche/?q=${encodeURIComponent(this.currentQuery)}`
    this.showAllLink.textContent = 'Alle Ergebnisse anzeigen'
    this.showAllLink.hidden = false
  }

  // -- Listbox state ---------------------------------------------------------

  private openIfHasHits(initialIndex?: number): void {
    if (!this.isOpen && this.hits.length > 0) {
      this.open()
      if (initialIndex !== undefined) this.setActiveIndex(initialIndex)
    }
  }

  private open(): void {
    if (this.getOptionCount() === 0) return
    this.isOpen = true
    this.listbox.hidden = false
    this.input.setAttribute('aria-expanded', 'true')
  }

  private close(): void {
    this.isOpen = false
    this.listbox.hidden = true
    this.input.setAttribute('aria-expanded', 'false')
    this.activeIndex = -1
    this.updateActiveDescendant()
    for (const opt of this.listbox.querySelectorAll('[role="option"]')) {
      opt.setAttribute('aria-selected', 'false')
    }
  }

  private clearResults(): void {
    this.hits = []
    this.listbox.replaceChildren()
    this.showAllLink.hidden = true
    this.close()
    this.liveRegion.textContent = ''
  }

  private getOptionCount(): number {
    return this.listbox.querySelectorAll('[role="option"]').length
  }

  private setActiveIndex(index: number): void {
    const options =
      this.listbox.querySelectorAll<HTMLElement>('[role="option"]')
    if (options.length === 0) return

    if (this.activeIndex >= 0 && this.activeIndex < options.length) {
      options[this.activeIndex].setAttribute('aria-selected', 'false')
    }

    this.activeIndex = index
    options[index].setAttribute('aria-selected', 'true')
    options[index].scrollIntoView({ block: 'nearest' })
    this.updateActiveDescendant()
  }

  private updateActiveDescendant(): void {
    this.input.setAttribute(
      'aria-activedescendant',
      this.activeIndex >= 0 ? `${OPTION_PREFIX}${this.activeIndex}` : '',
    )
  }

  private selectOption(index: number): void {
    const option =
      this.listbox.querySelectorAll<HTMLElement>('[role="option"]')[index]
    const url = option?.dataset.url
    if (url) {
      this.close()
      window.location.assign(url)
    }
  }

  private navigateToSearch(query: string): void {
    window.location.assign(`/suche/?q=${encodeURIComponent(query)}`)
  }
}

customElements.define('recipe-search', RecipeSearch)
