import { describe, expect, it } from 'vitest'
import { fetchAllPages } from './pagination'

function createPagedFetcher(totalItems: number) {
  const calls: Array<{ page: number; size: number }> = []

  return {
    calls,
    fetchPage: async (page: number, size: number) => {
      calls.push({ page, size })

      const start = (page - 1) * size
      const content = Array.from(
        { length: Math.max(Math.min(size, totalItems - start), 0) },
        (_, index) => start + index + 1,
      )

      return {
        content,
        totalPages: Math.max(Math.ceil(totalItems / size), 1),
      }
    },
  }
}

describe('fetchAllPages', () => {
  it.each([0, 1, 100, 101, 201])(
    'returns the complete ordered collection for %i item(s)',
    async (totalItems) => {
      const { fetchPage } = createPagedFetcher(totalItems)

      const result = await fetchAllPages(fetchPage)

      expect(result).toEqual(
        Array.from({ length: totalItems }, (_, index) => index + 1),
      )
    },
  )

  it('uses the configured page size and requests every remaining page once', async () => {
    const { calls, fetchPage } = createPagedFetcher(201)

    await fetchAllPages(fetchPage)

    expect(calls).toEqual([
      { page: 1, size: 100 },
      { page: 2, size: 100 },
      { page: 3, size: 100 },
    ])
  })
})
