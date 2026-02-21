import test from 'ava'
import { readFileSync } from 'fs'

test('uses publishedCards collection, not unfiltered cards', (t) => {
  const source = readFileSync(
    new URL('../podcast.11ty.js', import.meta.url),
    'utf-8',
  )

  t.regex(
    source,
    /collections\.publishedCards/,
    'podcast.11ty.js must use collections.publishedCards',
  )
})
