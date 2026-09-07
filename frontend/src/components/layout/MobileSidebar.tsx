import { useEffect } from 'react'
import { X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { navigationItems } from '../../data/navigation'
import type { NavigationItem } from '../../data/navigation'
import { useAuthStore } from '../../store/authStore'
import type { SystemUser } from '../../types/domain'
import { SidebarUserMenu } from './SidebarUserMenu'

type MobileSidebarProps = {
  open: boolean
  onClose: () => void
  onChangePassword: () => void
}

type NavigationGroup = {
  title: string
  paths: string[]
}

const navigationGroups: NavigationGroup[] = [
  {
    title: 'Operations',
    paths: ['/dashboard', '/items', '/inventory', '/history'],
  },
  {
    title: 'Management',
    paths: ['/requests', '/suppliers', '/users'],
  },
  {
    title: 'Insights',
    paths: ['/reports'],
  },
  {
    title: 'System',
    paths: ['/settings'],
  },
]

function getGroupedNavigationItems(
  items: NavigationItem[],
  currentRole: SystemUser['role'],
) {
  return navigationGroups
    .map((group) => {
      const groupItems = group.paths
        .map((path) => items.find((item) => item.path === path))
        .filter((item): item is NavigationItem => {
          return Boolean(item && item.allowedRoles.includes(currentRole))
        })

      return {
        ...group,
        items: groupItems,
      }
    })
    .filter((group) => group.items.length > 0)
}

export function MobileSidebar({
  open,
  onClose,
  onChangePassword,
}: MobileSidebarProps) {
  const navigate = useNavigate()

  const currentRole = useAuthStore((state) => state.currentRole)
  const logout = useAuthStore((state) => state.logout)

  const groupedNavigationItems = getGroupedNavigationItems(
    navigationItems,
    currentRole,
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  function handleLogout() {
    logout()
    onClose()
    navigate('/login')
  }

  function handleChangePassword() {
    onClose()
    onChangePassword()
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/72 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close menu"
      />

      <aside className="mobile-sidebar-panel relative flex h-dvh w-[min(84vw,320px)] flex-col overflow-hidden border-r border-nexus-border bg-white shadow-[20px_0_60px_rgba(0,0,0,0.34)]">

        <header className="shrink-0 px-5 pb-4 pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="sidebar-toggle-button flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <nav className="sidebar-mobile-scroll flex-1 overflow-y-auto px-5 pb-5 pt-2">
          <div className="space-y-6">
            {groupedNavigationItems.map((group) => (
              <section key={group.title}>
                <p className="mb-2 px-1 sidebar-nav-heading">
                  {group.title}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          [
                            'group relative flex h-10 items-center gap-3 rounded-md px-3 sidebar-nav-item transition-colors',
                            isActive
                              ? 'bg-nexus-bright text-white'
                              : '',
                          ].join(' ')
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              size={17}
                              strokeWidth={2.25}
                              className={
                                isActive
                                  ? 'text-white'
                                  : 'transition-colors'
                              }
                            />

                            <span className="flex-1 truncate">
                              {item.label}
                            </span>

                            {item.badge && (
                              <span
                                className={[
                                  'rounded px-2 py-0.5 text-[9px] font-semibold normal-case tracking-normal',
                                  isActive
                                    ? 'bg-white/18 text-white'
                                    : 'bg-[#eaf2ff] text-nexus-bright',
                                ].join(' ')}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <footer className="relative shrink-0 border-t border-nexus-border bg-white p-3">
          <SidebarUserMenu
            onChangePassword={handleChangePassword}
            onLogout={handleLogout}
          />
        </footer>
      </aside>
    </div>
  )
}
