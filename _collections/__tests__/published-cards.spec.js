import test from 'ava'

import publishedCards from '../published-cards.js'

const PAST_DATE = new Date('2024-01-01')
const FUTURE_DATE = new Date('2099-01-01')

function mockCollectionAPI(cards) {
  return { getFilteredByGlob: () => cards }
}

test('excludes future-dated cards', (t) => {
  const api = mockCollectionAPI([
    { data: { date: PAST_DATE } },
    { data: { date: FUTURE_DATE } },
  ])

  const result = publishedCards(api)
  t.is(result.length, 1)
})

test('includes cards dated today (>= not >)', (t) => {
  const todayMidnight = new Date()
  todayMidnight.setHours(0, 0, 0, 0)

  const api = mockCollectionAPI([{ data: { date: todayMidnight } }])

  const result = publishedCards(api)
  t.is(result.length, 1)
})
