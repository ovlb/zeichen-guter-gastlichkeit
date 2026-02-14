import type { LiteClient } from 'algoliasearch/lite'

let clientPromise: Promise<LiteClient> | null = null

/** Lazy-loads algoliasearch/lite and returns a shared client instance. */
export function getSearchClient(
  appId: string,
  searchKey: string,
): Promise<LiteClient> {
  if (!clientPromise) {
    clientPromise = import('algoliasearch/lite').then((mod) =>
      mod.liteClient(appId, searchKey),
    )
  }
  return clientPromise
}
