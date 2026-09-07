import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { KeyboardEvent } from 'react'
import {
  Check,
  ChevronDown,
  Loader2,
  PackageSearch,
  Search,
} from 'lucide-react'
import clsx from 'clsx'
import type { InventoryItem } from '../../types/domain'
import { normalizeSearch } from '../../utils/formatters'

type ItemSearchSelectProps = {
  hideStockInfo?: boolean
  label: string
  items: InventoryItem[]
  value: string
  onChange: (itemId: string) => void
  placeholder?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  showStock?: boolean
  showCode?: boolean
  maxResults?: number
  selectedItem?: InventoryItem | null
  onSearch?: (term: string) => void
  isSearching?: boolean
  searchError?: string
}

type DropdownPosition = {
  top: number
  left: number
  width: number
}

const MIN_SEARCH_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 350

export function ItemSearchSelect({
  hideStockInfo = false,
  label,
  items,
  value,
  onChange,
  placeholder = 'Enter a code, name, category, or location...',
  helperText = 'Enter at least 2 characters. Only the most relevant results are shown.',
  required,
  disabled,
  showStock = true,
  showCode = true,
  maxResults = 8,
  selectedItem: selectedItemProp = null,
  onSearch,
  isSearching = false,
  searchError = '',
}: ItemSearchSelectProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
  })

  const remoteSearchEnabled = typeof onSearch === 'function'
  const normalizedSearch = useMemo(() => normalizeSearch(search), [search])
  const hasMinimumSearch = normalizedSearch.length >= MIN_SEARCH_LENGTH

  const selectedItem = useMemo(() => {
    return selectedItemProp ?? items.find((item) => item.id === value)
  }, [items, selectedItemProp, value])

  const visibleItems = useMemo(() => {
    if (!hasMinimumSearch) {
      return []
    }

    if (remoteSearchEnabled) {
      return items.slice(0, maxResults)
    }

    return items
      .filter((item) => {
        const searchableText = normalizeSearch(
          `${item.code} ${item.name} ${item.category} ${item.supplierName} ${item.location}`,
        )

        return searchableText.includes(normalizedSearch)
      })
      .slice(0, maxResults)
  }, [hasMinimumSearch, items, maxResults, normalizedSearch, remoteSearchEnabled])

  const safeActiveIndex = visibleItems.length === 0
    ? 0
    : Math.min(activeIndex, visibleItems.length - 1)

  const shouldShowItemMetadata = showStock && !hideStockInfo

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

    updatePosition()
    setOpen(true)

    window.setTimeout(() => {
      searchInputRef.current?.focus()
    }, 0)
  }

  function closeDropdown() {
    setOpen(false)
    setSearch('')
    setActiveIndex(0)
  }

  function selectItem(item: InventoryItem) {
    onChange(item.id)
    closeDropdown()
    triggerRef.current?.focus()
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      openDropdown()
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeDropdown()
      triggerRef.current?.focus()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, Math.max(visibleItems.length - 1, 0)))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      const item = visibleItems[safeActiveIndex]

      if (item) {
        selectItem(item)
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

  useEffect(() => {
    if (!open || !remoteSearchEnabled || !onSearch) {
      return
    }

    if (!hasMinimumSearch) {
      onSearch('')
      return
    }

    const timeoutId = window.setTimeout(() => {
      onSearch(search.trim())
      setActiveIndex(0)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [hasMinimumSearch, onSearch, open, remoteSearchEnabled, search])

  return (
    <div className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-bold text-nexus-navy">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>

        <span className="text-xs font-semibold text-nexus-muted">
          up to {maxResults} results
        </span>
      </div>

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            closeDropdown()
          } else {
            openDropdown()
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className={clsx(
          'flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-[#b7c8df] bg-[#f8fbff] px-4 text-left text-sm font-semibold text-nexus-navy outline-none transition-colors focus:border-nexus-bright focus:bg-white disabled:cursor-not-allowed disabled:opacity-60',
          open && 'border-nexus-bright bg-white',
        )}
      >
        <span className="min-w-0 flex-1">
          {selectedItem ? (
            <span className="block">
              <span className="block truncate text-nexus-navy">
                {showCode ? `${selectedItem.code} · ${selectedItem.name}` : selectedItem.name}
              </span>

              {shouldShowItemMetadata && (
                <span className="mt-0.5 block truncate text-xs font-semibold text-nexus-muted">
                  {[selectedItem.category, selectedItem.location].filter(Boolean).join(' · ')}
                </span>
              )}
            </span>
          ) : (
            <span className="text-[#72839a]">
              Select an item
            </span>
          )}
        </span>

        <ChevronDown
          size={18}
          className={clsx(
            'shrink-0 text-nexus-navy transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      <input
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        value={value}
        required={required}
        onChange={() => undefined}
      />

      {helperText && (
        <p className="mt-2 text-xs leading-5 text-nexus-muted">
          {helperText}
        </p>
      )}

      {open && (
        <div
          ref={dropdownRef}
          role="listbox"
          className="fixed z-[90] overflow-hidden rounded-lg border border-[#b7c8df] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.2)]"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
          }}
        >
          <div className="border-b border-[#d7e1ef] p-3">
            <div className="flex h-10 items-center gap-3 rounded-lg border border-[#b7c8df] bg-[#f8fbff] px-3 focus-within:border-nexus-bright focus-within:bg-white">
              <Search size={17} className="shrink-0 text-nexus-bright" />

              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={handleSearchKeyDown}
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-nexus-navy outline-none placeholder:text-[#72839a]"
                placeholder={placeholder}
              />
            </div>
          </div>

          <div className="custom-scrollbar max-h-72 overflow-y-auto p-1.5">
            {!hasMinimumSearch && (
              <div className="px-4 py-8 text-center">
                <PackageSearch size={24} className="mx-auto text-nexus-bright" />

                <p className="mt-3 text-sm font-bold text-nexus-navy">
                  Search for an item
                </p>

                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-nexus-muted">
                  Enter at least 2 characters to keep the result list focused.
                </p>
              </div>
            )}

            {hasMinimumSearch && isSearching && (
              <div className="px-4 py-8 text-center">
                <Loader2 size={24} className="mx-auto animate-spin text-nexus-bright" />

                <p className="mt-3 text-sm font-bold text-nexus-navy">
                  Searching items...
                </p>
              </div>
            )}

            {hasMinimumSearch && !isSearching && searchError && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-bold text-red-600">
                  Could not search for items
                </p>

                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-nexus-muted">
                  {searchError}
                </p>
              </div>
            )}

            {hasMinimumSearch && !isSearching && !searchError && visibleItems.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-bold text-nexus-navy">
                  No items found
                </p>

                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-nexus-muted">
                  Review the search term and try again.
                </p>
              </div>
            )}

            {hasMinimumSearch && !isSearching && !searchError && visibleItems.map((item, index) => {
              const selected = item.id === value
              const active = index === safeActiveIndex

              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectItem(item)}
                  className={clsx(
                    'flex min-h-14 w-full items-center justify-between gap-3 rounded-md px-3 text-left transition-colors',
                    selected
                      ? 'bg-[#004cc2] text-white'
                      : active
                        ? 'bg-nexus-soft text-nexus-navy'
                        : 'text-nexus-navy hover:bg-nexus-soft',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className={clsx('block truncate text-sm font-bold', selected && 'text-white')}>
                      {showCode ? `${item.code} · ${item.name}` : item.name}
                    </span>

                    {shouldShowItemMetadata && (
                      <span className={clsx('mt-0.5 block truncate text-xs font-semibold', selected ? 'text-white/82' : 'text-nexus-muted')}>
                        {[item.category, item.location].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </span>

                  {selected && <Check size={16} className="shrink-0 text-white" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
