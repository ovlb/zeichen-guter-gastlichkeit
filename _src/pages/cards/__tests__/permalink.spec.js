import test from 'ava'

import cardsData from '../cards.11tydata.js'
import { isPublished } from '../../../../_helper/content-scheduling.js'

const PAST_DATE = new Date('2024-01-01')
const FUTURE_DATE = new Date('2099-01-01')

function bindPermalink() {
  return cardsData.permalink.bind({
    isPublished: (date) => isPublished(date),
    slugify: (s) => s.replace(/\s+/g, '-'),
  })
}

test('returns false for future-dated cards', (t) => {
  const permalink = bindPermalink()

  const result = permalink({
    series: [{ id: 1, name: 'Test Series' }],
    title: 'Test Card',
    seriesId: 1,
    part: null,
    date: FUTURE_DATE,
  })

  t.is(result, false)
})

test('returns URL for published cards', (t) => {
  const permalink = bindPermalink()

  const result = permalink({
    series: [{ id: 1, name: 'Aperitifs' }],
    title: 'Campari Soda',
    seriesId: 1,
    part: null,
    date: PAST_DATE,
  })

  t.is(typeof result, 'string')
  t.true(result.startsWith('/'))
  t.true(result.endsWith('/'))
})
