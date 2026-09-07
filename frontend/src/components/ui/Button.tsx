import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-nexus-bright text-white hover:bg-nexus-blue',
  secondary:
    'border border-[#aebfda] bg-[#f3f7fd] text-nexus-navy hover:border-nexus-bright hover:bg-[#e8f1ff]',
  danger:
    'bg-nexus-danger text-white hover:bg-red-700',
  ghost:
    'text-nexus-navy hover:bg-nexus-soft hover:text-nexus-blue',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-md px-3 text-xs',
  md: 'h-11 rounded-lg px-5 text-sm',
  lg: 'h-12 rounded-lg px-6 text-base',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
