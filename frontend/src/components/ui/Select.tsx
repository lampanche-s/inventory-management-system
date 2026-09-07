import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  ChangeEventHandler,
  KeyboardEvent,
} from 'react'
import { Check, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

type SelectOption = {
  label: string
  value: string
}

type SelectProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'defaultValue' | 'onChange' | 'type'
> & {
  label?: string
  options: SelectOption[]
  value?: string
  defaultValue?: string
  name?: string
  required?: boolean
  onChange?: ChangeEventHandler<HTMLSelectElement>
}

type DropdownPosition = {
  top: number
  left: number
  width: number
}

function createSelectChangeEvent(
  value: string,
  name?: string,
): ChangeEvent<HTMLSelectElement> {
  return {
    target: {
      value,
      name,
    },
    currentTarget: {
      value,
      name,
    },
  } as unknown as ChangeEvent<HTMLSelectElement>
}

export function Select({
  label,
  options,
  value,
  defaultValue,
  name,
  required,
  disabled,
  className,
  onChange,
  id,
  ...props
}: SelectProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? value ?? options[0]?.value ?? '',
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
  })

  const selectedValue = value ?? internalValue

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === selectedValue)
  }, [options, selectedValue])

  const dropdownId = id ? `${id}-dropdown` : undefined

  function updatePosition() {
    const trigger = triggerRef.current

    if (!trigger) {
      return
    }

    const rect = trigger.getBoundingClientRect()

    setPosition({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    })
  }

  function openDropdown() {
    if (disabled) {
      return
    }

    const selectedIndex = options.findIndex(
      (option) => option.value === selectedValue,
    )

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    updatePosition()
    setOpen(true)
  }

  function closeDropdown() {
    setOpen(false)
  }

  function selectOption(option: SelectOption) {
    if (!value) {
      setInternalValue(option.value)
    }

    onChange?.(createSelectChangeEvent(option.value, name))
    closeDropdown()
    triggerRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return
    }

    if (!open && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault()
      openDropdown()
      return
    }

    if (!open) {
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeDropdown()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, options.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()

      const option = options[activeIndex]

      if (option) {
        selectOption(option)
      }
    }
  }

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node

      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return
      }

      closeDropdown()
    }

    function handleWindowChange() {
      updatePosition()
    }

    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('resize', handleWindowChange)
    window.addEventListener('scroll', handleWindowChange, true)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('resize', handleWindowChange)
      window.removeEventListener('scroll', handleWindowChange, true)
    }
  }, [open])

  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-bold text-nexus-navy">
          {label}
        </span>
      )}

      <input
        type="hidden"
        name={name}
        value={selectedValue}
        required={required}
        readOnly
      />

      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={dropdownId}
        onClick={() => {
          if (open) {
            closeDropdown()
          } else {
            openDropdown()
          }
        }}
        onKeyDown={handleKeyDown}
        className={clsx(
          'flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-[#b7c8df] bg-[#f8fbff] px-4 text-left text-sm font-semibold text-nexus-navy outline-none transition-colors placeholder:text-[#72839a] focus:border-nexus-bright focus:bg-white disabled:cursor-not-allowed disabled:opacity-60',
          open && 'border-nexus-bright bg-white',
          className,
        )}
        {...props}
      >
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.label ?? 'Select'}
        </span>

        <ChevronDown
          size={18}
          className={clsx(
            'shrink-0 text-nexus-navy transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          id={dropdownId}
          role="listbox"
          className="custom-select-dropdown fixed z-[80] max-h-72 overflow-hidden rounded-lg border border-[#b7c8df] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
          }}
        >
          <div className="custom-scrollbar max-h-72 overflow-y-auto p-1.5">
            {options.map((option, index) => {
              const selected = option.value === selectedValue
              const active = index === activeIndex

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  className={clsx(
                    'flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm font-semibold transition-colors',
                    selected
                      ? 'bg-[#004cc2] text-white'
                      : active
                        ? 'bg-nexus-soft text-nexus-navy'
                        : 'text-nexus-navy hover:bg-nexus-soft',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>

                  {selected && <Check size={16} className="shrink-0 text-white" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </label>
  )
}
