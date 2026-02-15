import type { SearchHit } from './types.js'
import { getSearchClient } from './algolia-client.js'
import { CARDS_INDEX, publishedFilter } from './constants.js'

export abstract class SearchBase extends HTMLElement {
  protected currentQuery = ''
  protected debounceTimer: ReturnType<typeof setTimeout> | null = null

  protected get appId(): string {
    return this.getAttribute('app-id') ?? ''
  }

  protected get searchKey(): string {
    return this.getAttribute('search-key') ?? ''
  }

  disconnectedCallback(): void {
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer)
  }

  /** Execute single-index search. Returns null if query is stale, throws on error. */
  protected async executeSearch(
    query: string,
    hitsPerPage: number,
  ): Promise<SearchHit[] | null> {
    this.currentQuery = query

    const client = await getSearchClient(this.appId, this.searchKey)
    const { results } = await client.search<SearchHit>({
      requests: [
        {
          indexName: CARDS_INDEX,
          query,
          hitsPerPage,
          filters: publishedFilter(),
        },
      ],
    })

    if (query !== this.currentQuery) return null

    const [result] = results as Array<{ hits: SearchHit[] }>
    return result?.hits ?? []
  }
}
