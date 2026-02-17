class Home {
  data() {
    return {
      layout: 'home',
      permalink: '/',
      templateClass: 'page-home',
      pageCSS: 'home.css',
    }
  }

  renderGroups(allGroups, groupsWithContent) {
    return `<ol class="group-list">
      ${allGroups
        .map((g) => {
          if (groupsWithContent.includes(g.id)) {
            return `<li><a href="/${this.slugify(g.name)}/">${g.name}</a></li>`
          }

          return `<li>${g.name}</li>`
        })
        .join('')}
    </ol>`
  }

  render({ series, collections, build }) {
    return `<section class="home-intro">
      <recipe-search app-id="${build.algoliaAppId}" search-key="${
      build.algoliaSearchKey
    }"></recipe-search>
      <auf-gut-glueck></auf-gut-glueck>
    </section>
    <div class="ornamental-frame home-frame">
      <span class="frame-corners" aria-hidden="true"></span>
      <section class="home-intro">
        <p class="text-centered">
          Hunderte guter und erprobter Ratschläge – vom Einkaufen bis zur vollendeten
          Speisezubereitung – finden Sie in 256 Karten übersichtlich in 25 Gruppen
          gegliedert.
        </p>
        ${this.renderGroups(series, collections.seriesWithEntries)}
        <p class="text-centered">
          <small>
            Bitte beachten Sie auch die auf der Rückseite <a href="/hinweise/">gegebenen Hinweise</a>!
          </small>
        </p>
        <p class="text-centered">
          <small>
            Neue Karten Montag–Freitag.
          </small>
        </p>
      </section>
    </div>
    <script type="module" loading="lazy" src="/js/recipe-search.js"></script>
    <script type="module" loading="lazy" src="/js/auf-gut-glueck.js"></script>
  `
  }
}

export default Home
