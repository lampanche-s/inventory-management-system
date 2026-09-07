import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

type PaginationProps = {
  page: number
  totalPages: number
  totalItems?: number
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--app-border)] bg-white px-4 py-4 shadow-none sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-nexus-muted">
        Page{' '}
        <span className="font-bold text-nexus-navy">{page}</span>
        {' '}of{' '}
        <span className="font-bold text-nexus-navy">{safeTotalPages}</span>
        {typeof totalItems === 'number' && (
          <>
            {' '}·{' '}
            <span className="font-bold text-nexus-navy">{totalItems}</span>
            {' '}records
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
          Previous
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
