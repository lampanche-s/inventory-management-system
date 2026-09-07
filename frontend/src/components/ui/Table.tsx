import type { ReactNode } from 'react'
import clsx from 'clsx'

export type TableColumn<T> = {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  render: (row: T) => ReactNode
}

type TableProps<T> = {
  columns: TableColumn<T>[]
  data: T[]
  emptyTitle?: string
  emptyDescription?: string
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export function Table<T>({
  columns,
  data,
  emptyTitle = 'No records found',
  emptyDescription = 'Adjust the filters or create a new item.',
}: TableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--app-border)] bg-white shadow-none">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-nexus-panel-soft">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'border-b border-nexus-border px-5 py-3.5 text-xs font-semibold normal-case tracking-normal text-nexus-muted',
                    alignClasses[column.align ?? 'left'],
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="group transition-colors hover:bg-nexus-panel-soft"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={clsx(
                        'border-b border-nexus-border px-5 py-4 text-sm text-nexus-navy last:border-b-0',
                        alignClasses[column.align ?? 'left'],
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-14 text-center">
                  <p className="font-display text-xl font-bold text-nexus-navy">
                    {emptyTitle}
                  </p>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-nexus-muted">
                    {emptyDescription}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
