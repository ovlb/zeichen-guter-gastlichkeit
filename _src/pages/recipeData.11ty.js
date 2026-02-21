class RecipeData {
  data() {
    return {
      permalink: '/recipe-data.json',
      layout: null,
      eleventyExcludeFromCollections: true,
    }
  }

  async render({ collections }) {
    const cards = collections.publishedCards.map((card) => ({
      title: card.data.title,
      date: card.data.date,
      permalink: card.url,
    }))

    return JSON.stringify(cards)
  }
}

export default RecipeData
