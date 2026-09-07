import type { TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  helperText?: string
}

export function Textarea({
  label,
  helperText,
  className,
  id,
  ...props
}: TextareaProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-bold text-nexus-navy">
          {label}
        </span>
      )}

      <textarea
        id={id}
        className={clsx(
          'min-h-28 w-full resize-y rounded-lg border border-[#b7c8df] bg-[#f8fbff] px-4 py-3 text-sm text-nexus-navy outline-none transition-colors placeholder:text-[#72839a] focus:border-nexus-bright focus:bg-white',
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
