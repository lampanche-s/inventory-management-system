import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description: ReactNode
  actions?: ReactNode
}

export function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-4xl font-bold tracking-tight text-nexus-navy">
          {title}
        </h1>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-nexus-muted">
          {description}
        </p>
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
