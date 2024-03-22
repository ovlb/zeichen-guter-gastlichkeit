module.exports = {
  tags: ['card'],
  permalink: function (data) {
    const { name: seriesName } = data.series.find(
      (ser) => ser.id === data.seriesId,
    )

    return `/${seriesName.toLocaleLowerCase('de')}/${
      data.cardNumber
    }-${data.title.toLocaleLowerCase('de')}/`
  },
}
