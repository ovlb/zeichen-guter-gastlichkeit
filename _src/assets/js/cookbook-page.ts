import { getAll, remove } from './lib/cookbook-store.js'
import type { CookbookEntry } from './lib/cookbook-store.js'
import { escapeHtml, escapeAttr } from './lib/html.js'

class CookbookPage extends HTMLElement {
  #entries: CookbookEntry[] = []
  #activeFacets = new Set<string>()
  #activeType: 'recipe' | 'drink' | null = null
  #liveRegion!: HTMLElement
  #cardStyles = new Map<string, { rotate: number; zIndex: number }>()

  connectedCallback(): void {
    this.#entries = getAll()
    this.#render()

    this.addEventListener('click', this.#handleClick)
    window.addEventListener('storage', this.#handleStorage)
  }

  disconnectedCallback(): void {
    this.removeEventListener('click', this.#handleClick)
    window.removeEventListener('storage', this.#handleStorage)
  }

  #handleStorage = (event: StorageEvent): void => {
    if (event.key !== 'cookbook') return
    this.#entries = getAll()
    this.#activeFacets.clear()
    this.#activeType = null
    this.#render()
  }

  #handleClick = (event: Event): void => {
    const target = event.target as HTMLElement

    const removeButton = target.closest<HTMLButtonElement>('[data-remove-url]')
    if (removeButton) {
      const url = removeButton.dataset.removeUrl!
      remove(url)
      this.#entries = this.#entries.filter((e) => e.url !== url)
      this.#cardStyles.delete(url)
      const remainingSeries = new Set(this.#entries.map((e) => e.seriesName))
      for (const facet of this.#activeFacets) {
        if (!remainingSeries.has(facet)) this.#activeFacets.delete(facet)
      }
      this.#render()
      this.#announce('Rezept entfernt')
      return
    }

    const chip = target.closest<HTMLButtonElement>('.facet-chip')
    if (!chip) return

    const type = chip.dataset.type as 'recipe' | 'drink' | undefined
    if (type) {
      this.#activeType = this.#activeType === type ? null : type
      this.#activeFacets.clear()
      this.#render()
      return
    }

    const series = chip.dataset.series
    if (!series) return

    if (this.#activeFacets.has(series)) {
      this.#activeFacets.delete(series)
    } else {
      this.#activeFacets.add(series)
    }

    this.#render()
  }

  #render(): void {
    if (this.#entries.length === 0) {
      this.innerHTML = `
        <h1 class="cookbook-heading">Kochbuch</h1>
        <p class="cookbook-empty">Noch keine Rezepte gespeichert.</p>
        <div class="sr-only" aria-live="polite" aria-atomic="true"></div>
      `
      this.#liveRegion = this.querySelector('[aria-live]')!
      return
    }

    const filtered = this.#getFilteredEntries()
    const typeCounts = this.#getTypeCounts()
    const facets = this.#getAvailableFacets()

    const isFiltered =
      this.#activeType !== null || this.#activeFacets.size > 0
    const countText = isFiltered
      ? `${filtered.length} von ${this.#entries.length} Rezepten`
      : `${this.#entries.length} Rezepte`

    const typeHtml = `<div class="facets" role="group" aria-label="Nach Typ filtern">
      <button class="facet-chip" data-type="recipe" aria-pressed="${this.#activeType === 'recipe'}" type="button">
        Rezepte (${typeCounts.get('recipe') ?? 0})
      </button>
      <button class="facet-chip" data-type="drink" aria-pressed="${this.#activeType === 'drink'}" type="button">
        Drinks (${typeCounts.get('drink') ?? 0})
      </button>
    </div>`

    // Only show series filter when there is more than one series to choose between
    const facetHtml =
      facets.length > 1
        ? `<div class="facets" role="group" aria-label="Nach Serie filtern">
            ${facets
              .map(
                (name) =>
                  `<button class="facet-chip" data-series="${escapeAttr(name)}" aria-pressed="${this.#activeFacets.has(name)}" type="button">${escapeHtml(name)}</button>`,
              )
              .join('')}
          </div>`
        : ''

    const cardsHtml =
      filtered.length > 0
        ? `<ol role="list" class="card-archive-list">
            ${filtered.map((entry) => `<li>${this.#renderCard(entry)}</li>`).join('')}
          </ol>`
        : '<p class="cookbook-empty">Keine Rezepte in dieser Auswahl</p>'

    this.innerHTML = `
      <h1 class="cookbook-heading">Kochbuch</h1>
      <p class="cookbook-meta">${countText}</p>
      ${typeHtml}
      ${facetHtml}
      ${cardsHtml}
      <div class="sr-only" aria-live="polite" aria-atomic="true"></div>
    `
    this.#liveRegion = this.querySelector('[aria-live]')!
    this.#announce(countText)
  }

  #getCardStyle(url: string): { rotate: number; zIndex: number } {
    if (!this.#cardStyles.has(url)) {
      const sign = Math.round(Math.random()) * 2 - 1
      this.#cardStyles.set(url, {
        rotate: sign * (Math.random() * 3),
        zIndex: Math.floor(Math.random() * 10) + 1,
      })
    }
    return this.#cardStyles.get(url)!
  }

  #renderCard(entry: CookbookEntry): string {
    const { rotate, zIndex } = this.#getCardStyle(entry.url)

    const sourcesHtml = entry.sources
      .map(
        (s) =>
          `<source type="${escapeAttr(s.type)}" sizes="15rem" srcset="${escapeAttr(s.srcset)}">`,
      )
      .join('')

    return `
      <article class="card-card" style="--card-rotate: ${rotate}deg; --card-z-index: ${zIndex}">
        <p class="card-card__series"><small>Serie ${entry.seriesId}/${entry.cardNumber}</small></p>
        <figure class="recipe-card-image">
          <picture>
            ${sourcesHtml}
            <img
              src="${escapeAttr(entry.imgSrc)}"
              width="${entry.imgWidth}"
              height="${entry.imgHeight}"
              alt="${escapeAttr(entry.imageAlt)}"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </figure>
        <h2 class="main-headline card-card__headline">
          <a href="${escapeAttr(entry.url)}">${escapeHtml(entry.title)}</a>
        </h2>
        <button
          class="cookbook-remove"
          data-remove-url="${escapeAttr(entry.url)}"
          type="button"
          aria-label="${escapeAttr(entry.title)} entfernen"
        >Entfernen</button>
      </article>
    `
  }

  #getTypeFiltered(): CookbookEntry[] {
    if (this.#activeType === null) return this.#entries
    return this.#entries.filter((e) => e.type === this.#activeType)
  }

  #getFilteredEntries(): CookbookEntry[] {
    const byType = this.#getTypeFiltered()
    if (this.#activeFacets.size === 0) return byType
    return byType.filter((e) => this.#activeFacets.has(e.seriesName))
  }

  #getTypeCounts(): Map<string, number> {
    const counts = new Map<string, number>()
    for (const entry of this.#entries) {
      counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1)
    }
    return counts
  }

  #getAvailableFacets(): string[] {
    const names = new Set<string>()
    for (const entry of this.#getTypeFiltered()) names.add(entry.seriesName)
    return [...names].sort((a, b) => a.localeCompare(b, 'de'))
  }

  #announce(message: string): void {
    if (!this.#liveRegion) return
    this.#liveRegion.textContent = ''
    requestAnimationFrame(() => {
      this.#liveRegion.textContent = message
    })
  }
}

customElements.define('cookbook-page', CookbookPage)
