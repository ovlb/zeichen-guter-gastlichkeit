import test from 'ava'

import seriesWithEntries from '../series-with-entries.js'

const PAST_DATE = new Date('2024-01-01')
const FUTURE_DATE = new Date('2099-01-01')

function mockCollectionAPI(cards) {
  return { getFilteredByGlob: () => cards }
}

test('only includes series that have published cards', (t) => {
  const api = mockCollectionAPI([
    { data: { date: PAST_DATE, seriesId: 1 } },
    { data: { date: PAST_DATE, seriesId: 3 } },
    { data: { date: FUTURE_DATE, seriesId: 5 } },
  ])

  const result = seriesWithEntries(api)
  t.deepEqual(result.sort(), [1, 3])
})

test('returns empty when all cards are future-dated', (t) => {
  const api = mockCollectionAPI([
    { data: { date: FUTURE_DATE, seriesId: 1 } },
    { data: { date: FUTURE_DATE, seriesId: 2 } },
  ])

  const result = seriesWithEntries(api)
  t.deepEqual(result, [])
})
