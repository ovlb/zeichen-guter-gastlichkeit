export const dateUtils = {
  isWeekend(date) {
    const day = date.getDay()
    return day === 0 || day === 6 // 0 is Sunday, 6 is Saturday
  },

  format(date) {
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  },

  formatYYYYMMDD(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  getNextBusinessDay(date) {
    const nextDate = new Date(date)
    const day = date.getDay()

    // Add one day by default
    let daysToAdd = 1

    if (day === 5) {
      // Friday -> skip to Monday
      daysToAdd = 3
    } else if (day === 6) {
      // Saturday -> skip to Monday (+2 days)
      daysToAdd = 2
    }
    // For Sunday (day === 0) and weekdays, we already have daysToAdd = 1

    nextDate.setDate(date.getDate() + daysToAdd)
    return nextDate
  },
}
