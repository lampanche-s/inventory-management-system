export type PageResult<T> = {
  content: T[]
  totalPages: number
}

export async function fetchAllPages<T>(
  fetchPage: (page: number, size: number) => Promise<PageResult<T>>,
  pageSize = 100,
) {
  const firstPage = await fetchPage(1, pageSize)
  const allContent = [...firstPage.content]

  if (firstPage.totalPages <= 1) {
    return allContent
  }

  const remainingPages = await Promise.all(
    Array.from(
      { length: firstPage.totalPages - 1 },
      (_, index) => fetchPage(index + 2, pageSize),
    ),
  )

  remainingPages.forEach((response) => {
    allContent.push(...response.content)
  })

  return allContent
}
