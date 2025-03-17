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

  render({ series, collections }) {
    return `<section class="home-intro">
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
    </section>
  `
  }
}

module.exports = Home
