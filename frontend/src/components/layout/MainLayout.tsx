import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ChangePasswordModal } from './ChangePasswordModal'
import { Header } from './Header'
import { MobileSidebar } from './MobileSidebar'
import { Sidebar } from './Sidebar'
import { SidebarEdgeToggle } from './SidebarEdgeToggle'

export function MainLayout() {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

  return (
    <div className="min-h-screen bg-nexus-dark text-white">
      <Sidebar
        open={isDesktopSidebarOpen}
        onChangePassword={() => setIsChangePasswordOpen(true)}
      />

      <SidebarEdgeToggle
        open={isDesktopSidebarOpen}
        onToggle={() => setIsDesktopSidebarOpen((current) => !current)}
      />

      <MobileSidebar
        open={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onChangePassword={() => setIsChangePasswordOpen(true)}
      />

      <div
        className={[
          'min-h-screen transition-[padding] duration-200 ease-out motion-reduce:transition-none',
          isDesktopSidebarOpen ? 'lg:pl-72' : 'lg:pl-0',
        ].join(' ')}
      >
        <Header onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />

        <main className="animate-view-in px-5 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>

        <ChangePasswordModal
          open={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      </div>
    </div>
  )
}
