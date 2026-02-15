// a web component (no dependency) that display a link with the label «Auf gut Glück» and links to a random card of any series in the JSON fetched from recipe-data.json

type RecipeData = {
  title: string
  permalink: string
}

class AufGutGlueck extends HTMLElement {
  #data: RecipeData[]

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.#data = []
  }

  getRandomCardLink(): string {
    const randomCard = this.#data[Math.floor(Math.random() * this.#data.length)]

    return randomCard.permalink
  }

  appendStyle() {
    const style = document.createElement('style')
    style.textContent = `
      .auf-gut-glueck {
        color: var(--accent);
        display: block;
        text-align: center;
      }
    `
    this.shadowRoot?.appendChild(style)
  }

  async connectedCallback() {
    this.appendStyle()

    try {
      const response = await fetch('/recipe-data.json')
      const data = (await response.json()) as RecipeData[]
      this.#data = data
    } catch (error) {
      console.error('Error fetching recipe data:', error)
    }

    const link = document.createElement('a')
    link.href = this.getRandomCardLink()
    link.textContent = 'Auf gut Glück'
    link.classList.add('auf-gut-glueck')

    this.shadowRoot?.appendChild(link)
  }
}

customElements.define('auf-gut-glueck', AufGutGlueck)
