const { baseURL } = require('./site')

module.exports = {
  language: 'de', // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
  image: `${baseURL}/img/favicon.png`,
  favicon: `${baseURL}/img/favicon.png`,
  author: {
    name: 'Oscar',
    email: 'o@ovl.design',
    link: 'https://www.ovl.design',
  },
}
