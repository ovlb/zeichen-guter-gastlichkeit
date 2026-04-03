class Kochbuch {
  data() {
    return {
      layout: 'base',
      title: 'Kochbuch',
      layoutClass: 'kochbuch-page',
      pageCSS: 'kochbuch.css',
      permalink: '/kochbuch/',
    }
  }

  render() {
    return '<cookbook-page></cookbook-page>'
  }
}

export default Kochbuch
