import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  variant?: 'default' | 'soft' | 'metric'
}

const variantClasses = {
  default: 'bg-white',
  soft: 'bg-white',
  metric: 'bg-white',
}

export function Card({
  children,
  variant = 'default',
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-[var(--app-border)] p-6 shadow-none',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
