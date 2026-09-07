import type { ReactNode } from 'react'

type MetricValueSize = 'sm' | 'md' | 'lg'

type MetricValueProps = {
  children: ReactNode
  isLoading?: boolean
  size?: MetricValueSize
  minWidth?: string
  className?: string
}

const sizeClasses: Record<MetricValueSize, string> = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
}

export function MetricValue({
  children,
  isLoading = false,
  size = 'lg',
  minWidth = '4.5ch',
  className = '',
}: MetricValueProps) {
  const resolvedClassName =
    className.trim() ||
    [
      'mt-3 block font-display font-bold leading-none text-nexus-navy tabular-nums',
      sizeClasses[size],
    ].join(' ')

  return (
    <strong
      className={resolvedClassName}
      style={{
        minWidth,
        minHeight: '1em',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {isLoading ? (
        <span
          className="inline-block h-[0.88em] w-full min-w-[inherit] rounded-lg bg-nexus-panel-soft align-middle text-transparent"
          aria-label="Loading"
        >
          0
        </span>
      ) : (
        children
      )}
    </strong>
  )
}
