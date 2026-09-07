import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  helperText?: string
}

export function Input({
  label,
  helperText,
  className,
  id,
  ...props
}: InputProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-bold text-nexus-navy">
          {label}
        </span>
      )}

      <input
        id={id}
        className={clsx(
          'h-11 w-full rounded-lg border border-[#b7c8df] bg-[#f8fbff] px-4 text-sm text-nexus-navy outline-none transition-colors placeholder:text-[#72839a] focus:border-nexus-bright focus:bg-white',
          className,
        )}
        {...props}
      />

      {helperText && (
        <span className="mt-2 block text-xs leading-5 text-nexus-muted">
          {helperText}
        </span>
      )}
    </label>
  )
}
