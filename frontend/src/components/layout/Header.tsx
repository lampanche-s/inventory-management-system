import { useEffect, useMemo, useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { NotificationPanel } from '../notifications/NotificationPanel'

type HeaderProps = {
  onOpenMobileMenu: () => void
}

function formatHeaderDateTime(date: Date) {
  const formattedDate = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const formattedTime = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${formattedDate} · ${formattedTime}`
}

export function Header({
  onOpenMobileMenu,
}: HeaderProps) {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(() => new Date())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentDate(new Date())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const dateTimeLabel = useMemo(() => {
    return formatHeaderDateTime(currentDate)
  }, [currentDate])

  return (
    <header className="sticky top-0 z-20 flex h-18 items-center border-b border-nexus-border bg-nexus-bg/85 px-4 backdrop-blur-xl lg:px-8">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-nexus-border bg-white/4 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden whitespace-nowrap text-sm font-semibold capitalize text-slate-500 xl:inline">
            {dateTimeLabel}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationPanelOpen((current) => !current)}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl text-[#64748b] transition-colors duration-150 hover:bg-[rgba(0,76,194,0.08)] hover:text-[#475569]"
              aria-label="Open notifications"
            >
              <Bell size={19} />

              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-(--app-red)" />
            </button>

            {isNotificationPanelOpen && (
              <NotificationPanel
                onClose={() => setIsNotificationPanelOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
