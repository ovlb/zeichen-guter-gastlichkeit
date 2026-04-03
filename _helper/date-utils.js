export const dateUtils = {
  formatter: new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  }),

  isWeekend(date) {
    const day = date.getUTCDay()
    return day === 0 || day === 6 // 0 is Sunday, 6 is Saturday
  },

  format(date) {
    return this.formatter.format(date)
  },

  formatYYYYMMDD(date) {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  },

  getNextBusinessDay(date) {
    const day = date.getUTCDay()

    const daysToAdd =
      new Map([
        [5, 3], // Friday -> skip to Monday (+3 days)
        [6, 2], // Saturday -> skip to Monday (+2 days)
      ]).get(day) || 1 // Default to 1 day for Sunday and weekdays

    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate() + daysToAdd,
      ),
    )
  },
}
