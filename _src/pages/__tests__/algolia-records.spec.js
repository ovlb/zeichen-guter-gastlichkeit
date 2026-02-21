import test from 'ava'

import AlgoliaRecords from '../algolia-records.11ty.js'

test('permalink is set in production mode', (t) => {
  const instance = new AlgoliaRecords()
  const { permalink } = instance.data()

  t.is(permalink, '/algolia-records.json')
})
