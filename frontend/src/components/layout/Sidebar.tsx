import { NavLink, useNavigate } from 'react-router-dom'
import { navigationItems } from '../../data/navigation'
import type { NavigationItem } from '../../data/navigation'
import { useAuthStore } from '../../store/authStore'
import type { SystemUser } from '../../types/domain'
import { SidebarUserMenu } from './SidebarUserMenu'

type NavigationGroup = {
  title: string
  paths: string[]
}

type SidebarProps = {
  open: boolean
  onChangePassword: () => void
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

export function Sidebar({
  open,
  onChangePassword,
}: SidebarProps) {
  const navigate = useNavigate()

  const currentRole = useAuthStore((state) => state.currentRole)
  const logout = useAuthStore((state) => state.logout)

  const groupedNavigationItems = getGroupedNavigationItems(
    navigationItems,
    currentRole,
  )

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={[
        'desktop-sidebar-panel fixed left-0 top-0 z-30 hidden h-screen w-72 overflow-hidden bg-white transition-transform duration-200 ease-out motion-reduce:transition-none lg:flex lg:flex-col',
        open ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      <div className="flex h-18 shrink-0 items-center border-b border-nexus-border px-5">
        <p className="whitespace-nowrap text-[17px] font-semibold leading-none text-nexus-navy">
          Stockroom Inventory Operations
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-r border-nexus-border">
        <nav className="sidebar-mobile-scroll flex-1 overflow-y-auto px-5 pb-2 pt-3">
          <div className="space-y-7">
            {groupedNavigationItems.map((group) => (
              <section key={group.title}>
                <p className="mb-3 px-1 sidebar-nav-heading">
                  {group.title}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          [
                            'group relative flex h-11 items-center gap-3 rounded-md px-3 sidebar-nav-item transition-colors',
                            isActive
                              ? 'bg-nexus-bright text-white'
                              : '',
                          ].join(' ')
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              size={18}
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
            onChangePassword={onChangePassword}
            onLogout={handleLogout}
          />
        </footer>
      </div>
    </aside>
  )
}
