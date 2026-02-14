class SearchPage {
  data() {
    return {
      layout: 'base',
      title: 'Suche',
      layoutClass: 'search-page',
      pageCSS: 'search.css',
      permalink: '/suche/',
    }
  }

  render({ build }) {
    return `
      <recipe-search-results app-id="${build.algoliaAppId}" search-key="${build.algoliaSearchKey}"></recipe-search-results>
      <script type="module" src="/js/recipe-search-results.js"></script>
    `
  }
}

export default SearchPage
