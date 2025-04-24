import test from 'ava'
import { dateUtils } from '../date-utils.js'

// Helper function for consistent date creation
const createDate = (dateString) => {
  const date = new Date(dateString)
  // Ensure date is interpreted in local timezone consistently
  date.setHours(0, 0, 0, 0)
  return date
}

// Helper for date equality assertion that's more readable than comparing timestamps
const areDatesEqual = (date1, date2) =>
  date1.getFullYear() === date2.getFullYear() &&
  date1.getMonth() === date2.getMonth() &&
  date1.getDate() === date2.getDate()

test('isWeekend identifies weekend days correctly', (t) => {
  const testCases = [
    { date: '2023-07-22', day: 'Saturday', expected: true },
    { date: '2023-07-23', day: 'Sunday', expected: true },
    { date: '2023-07-24', day: 'Monday', expected: false },
    { date: '2023-07-26', day: 'Wednesday', expected: false },
    { date: '2023-07-28', day: 'Friday', expected: false },
    // Edge cases
    { date: '2023-12-31', day: "Sunday (New Year's Eve)", expected: true },
    { date: '2024-02-29', day: 'Thursday (Leap year)', expected: false },
  ]

  testCases.forEach(({ date, day, expected }) => {
    const dateObj = createDate(date)
    const result = dateUtils.isWeekend(dateObj)
    t.is(
      result,
      expected,
      `${day} should ${expected ? '' : 'not '}be a weekend`,
    )
  })
})

test('date formatting functions return correct string formats', (t) => {
  const testCases = [
    { date: '2023-07-25', germanFormat: '25.07.2023', isoFormat: '2023-07-25' },
    { date: '2023-01-01', germanFormat: '01.01.2023', isoFormat: '2023-01-01' },
    { date: '2023-12-31', germanFormat: '31.12.2023', isoFormat: '2023-12-31' },
  ]

  testCases.forEach(({ date, germanFormat, isoFormat }) => {
    const dateObj = createDate(date)
    t.is(dateUtils.format(dateObj), germanFormat, `German format for ${date}`)
    t.is(dateUtils.formatYYYYMMDD(dateObj), isoFormat, `ISO format for ${date}`)
  })
})

test('getNextBusinessDay handles various scenarios correctly', (t) => {
  const testCases = [
    {
      input: '2023-07-25', // Tuesday
      expected: '2023-07-26', // Wednesday
      description: 'Regular weekday moves to next day',
    },
    {
      input: '2023-07-28', // Friday
      expected: '2023-07-31', // Monday
      description: 'Friday moves to Monday (skips weekend)',
    },
    {
      input: '2023-07-29', // Saturday
      expected: '2023-07-31', // Monday
      description: 'Saturday moves to Monday',
    },
    {
      input: '2023-12-31', // Sunday (New Year's Eve)
      expected: '2024-01-01', // Monday (New Year)
      description: 'Sunday at year boundary moves to next year',
    },
  ]

  testCases.forEach(({ input, expected, description }) => {
    const inputDate = createDate(input)
    const expectedDate = createDate(expected)
    const result = dateUtils.getNextBusinessDay(inputDate)

    t.true(
      areDatesEqual(result, expectedDate),
      `${description}: ${input} → ${expected}`,
    )
  })
})
