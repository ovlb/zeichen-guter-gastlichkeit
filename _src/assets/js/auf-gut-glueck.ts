type RecipeData = {
  title: string
  permalink: string
}

class AufGutGlueck extends HTMLElement {
  #data: RecipeData[] = []

  getRandomCardLink(): string {
    const randomCard = this.#data[Math.floor(Math.random() * this.#data.length)]
    return randomCard.permalink
  }

  async connectedCallback() {
    try {
      const response = await fetch('/recipe-data.json')
      this.#data = (await response.json()) as RecipeData[]
    } catch (error) {
      console.error('Error fetching recipe data:', error)
    }

    const link = document.createElement('a')
    link.href = this.getRandomCardLink()
    link.textContent = 'Auf gut Glück'
    this.appendChild(link)
  }
}

customElements.define('auf-gut-glueck', AufGutGlueck)
