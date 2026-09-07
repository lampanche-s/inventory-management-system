import { useEffect, useRef, useState } from 'react'
import { ChevronsUpDown, KeyRound, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

type SidebarUserMenuProps = {
  onChangePassword: () => void
  onLogout: () => void
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function SidebarUserMenu({
  onChangePassword,
  onLogout,
}: SidebarUserMenuProps) {
  const currentUser = useAuthStore((state) => state.currentUser)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const name = currentUser?.name?.trim() || 'Authenticated user'
  const email = currentUser?.email?.trim() || ''

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      <div
        role="menu"
        aria-hidden={!open}
        className={[
          'absolute bottom-[calc(100%+8px)] left-0 right-0 z-50 overflow-hidden rounded-lg border border-nexus-border bg-white',
          'will-change-opacity transition-opacity motion-reduce:transition-none',
          open
            ? 'pointer-events-auto opacity-100 duration-[120ms] ease-out'
            : 'pointer-events-none opacity-0 duration-[80ms] ease-in',
        ].join(' ')}
      >
        <button
          type="button"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={() => {
            setOpen(false)
            onChangePassword()
          }}
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-nexus-navy transition-colors hover:bg-[#f3f7fc]"
        >
          <KeyRound size={17} />
          Change password
        </button>

        <div className="h-px bg-nexus-border" />

        <button
          type="button"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={() => {
            setOpen(false)
            onLogout()
          }}
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-nexus-navy transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={17} />
          Log out
        </button>
      </div>

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[#f3f7fc]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-nexus-border bg-[#f4f7fb] text-xs font-medium text-nexus-muted">
          {getInitials(name)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-nexus-navy">
            {name}
          </span>

          {email && (
            <span className="mt-0.5 block truncate text-xs text-nexus-muted">
              {email}
            </span>
          )}
        </span>

        <ChevronsUpDown size={16} className="shrink-0 text-nexus-muted" />
      </button>
    </div>
  )
}
