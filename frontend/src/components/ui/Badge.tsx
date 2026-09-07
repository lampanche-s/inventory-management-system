import type { ReactNode } from 'react'
import clsx from 'clsx'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
  pulse?: boolean
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'border-green-500/25 bg-green-500/10 text-green-500',
  warning: 'border-amber-500/25 bg-amber-500/10 text-amber-500',
  danger: 'border-red-500/25 bg-red-500/10 text-red-500',
  info: 'border-blue-500/25 bg-blue-500/10 text-blue-500',
  neutral: 'border-slate-400/25 bg-slate-100 text-slate-600',
}

export function Badge({
  children,
  variant = 'neutral',
  pulse = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold normal-case tracking-normal',
        variantClasses[variant],
        className,
      )}
    >
      {pulse && (
        <span className="h-2 w-2 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  )
}
