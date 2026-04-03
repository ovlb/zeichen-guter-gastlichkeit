import { has, save, remove, entryType } from './lib/cookbook-store.js'
import type { CookbookEntry } from './lib/cookbook-store.js'

const BOOKMARK_OUTLINE = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`

const BOOKMARK_FILLED = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`

class CookbookButton extends HTMLElement {
  #button!: HTMLButtonElement
  #isSaved = false

  connectedCallback(): void {
    const url = this.getAttribute('card-url') ?? ''
    this.#isSaved = has(url)

    this.innerHTML = `<button class="cookbook-button" type="button" aria-pressed="${this.#isSaved}">
      <span class="cookbook-button__icon">${this.#isSaved ? BOOKMARK_FILLED : BOOKMARK_OUTLINE}</span>
      <span class="cookbook-button__label">${this.#isSaved ? 'Im Kochbuch gespeichert' : 'Zum Kochbuch hinzufügen'}</span>
    </button>`

    this.#button = this.querySelector('button')!
    this.#button.addEventListener('click', this.#handleClick)
  }

  disconnectedCallback(): void {
    this.#button?.removeEventListener('click', this.#handleClick)
  }

  #handleClick = (): void => {
    const url = this.getAttribute('card-url') ?? ''

    if (this.#isSaved) {
      remove(url)
      this.#isSaved = false
    } else {
      const entry = this.#buildEntry()
      if (entry) {
        save(entry)
        this.#isSaved = true
      }
    }

    this.#updateDisplay()
  }

  #buildEntry(): CookbookEntry | null {
    const picture = document.querySelector('.card-image picture')
    if (!picture) return null

    const sources = [...picture.querySelectorAll('source')].map(
      (source) => ({
        type: source.getAttribute('type') ?? '',
        srcset: source.getAttribute('srcset') ?? '',
      }),
    )

    const img = picture.querySelector('img')
    const seriesId = Number(this.getAttribute('series-id'))

    return {
      url: this.getAttribute('card-url') ?? '',
      title: this.getAttribute('card-title') ?? '',
      sources,
      imgSrc: img?.getAttribute('src') ?? '',
      imgWidth: Number(img?.getAttribute('width') ?? 0),
      imgHeight: Number(img?.getAttribute('height') ?? 0),
      imageAlt: this.getAttribute('image-alt') ?? '',
      seriesName: this.getAttribute('series-name') ?? '',
      seriesId,
      cardNumber: Number(this.getAttribute('card-number')),
      type: entryType(seriesId),
    }
  }

  #updateDisplay(): void {
    this.#button.setAttribute('aria-pressed', String(this.#isSaved))

    const icon = this.#button.querySelector('.cookbook-button__icon')!
    icon.innerHTML = this.#isSaved ? BOOKMARK_FILLED : BOOKMARK_OUTLINE

    const label = this.#button.querySelector('.cookbook-button__label')!
    label.textContent = this.#isSaved ? 'Im Kochbuch gespeichert' : 'Zum Kochbuch hinzufügen'
  }
}

customElements.define('cookbook-button', CookbookButton)
