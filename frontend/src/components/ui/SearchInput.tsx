import type { InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import clsx from 'clsx'

type SearchInputProps = InputHTMLAttributes<HTMLInputElement> & {
  wrapperClassName?: string
}

export function SearchInput({
  className,
  wrapperClassName,
  placeholder = 'Search...',
  ...props
}: SearchInputProps) {
  return (
    <div
      className={clsx(
        'flex h-11 items-center gap-3 rounded-lg border border-nexus-border bg-white px-4 transition-colors focus-within:border-nexus-bright',
        wrapperClassName,
      )}
    >
      <Search size={18} className="text-nexus-muted" />

      <input
        className={clsx(
          'h-full min-w-0 flex-1 bg-transparent text-sm text-nexus-navy outline-none placeholder:text-slate-500',
          className,
        )}
        placeholder={placeholder}
        {...props}
      />
    </div>
  )
}
