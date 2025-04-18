import siteData from './site.js'

export default {
  language: 'de', // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
  image: `${siteData.baseURL}/img/favicon.png`,
  favicon: `${siteData.baseURL}/img/favicon.png`,
  author: {
    name: 'Oscar',
    email: 'o@ovl.design',
    link: 'https://www.ovl.design',
  },
}
