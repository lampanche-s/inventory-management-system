import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthBootstrap } from './app/AuthBootstrap'
import { RoleProtectedRoute } from './app/RoleProtectedRoute'
import { MainLayout } from './components/layout/MainLayout'
import { AppLoading } from './components/ui/AppLoading'
import { RootRedirect } from './RootRedirect'

const DashboardPage = lazy(() =>
  import('./pages/Dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const HistoryPage = lazy(() =>
  import('./pages/History/HistoryPage').then((module) => ({ default: module.HistoryPage })),
)
const InventoryPage = lazy(() =>
  import('./pages/Inventory/InventoryPage').then((module) => ({ default: module.InventoryPage })),
)
const ItemsPage = lazy(() =>
  import('./pages/Items/ItemsPage').then((module) => ({ default: module.ItemsPage })),
)
const LoginPage = lazy(() =>
  import('./pages/Login/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const ReportsPage = lazy(() =>
  import('./pages/Reports/ReportsPage').then((module) => ({ default: module.ReportsPage })),
)
const RequestsPage = lazy(() =>
  import('./pages/Requests/RequestsPage').then((module) => ({ default: module.RequestsPage })),
)
const SettingsPage = lazy(() =>
  import('./pages/Settings/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)
const SupplierDetailsPage = lazy(() =>
  import('./pages/Suppliers/SupplierDetailsPage').then((module) => ({ default: module.SupplierDetailsPage })),
)
const SuppliersPage = lazy(() =>
  import('./pages/Suppliers/SuppliersPage').then((module) => ({ default: module.SuppliersPage })),
)
const UsersPage = lazy(() =>
  import('./pages/Users/UsersPage').then((module) => ({ default: module.UsersPage })),
)

function App() {
  return (
    <AuthBootstrap>
      <BrowserRouter>
        <Suspense fallback={<AppLoading />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<MainLayout />}>
              <Route path="/" element={<RootRedirect />} />

              <Route
                path="/dashboard"
                element={
                  <RoleProtectedRoute>
                    <DashboardPage />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="/items"
                element={
                  <RoleProtectedRoute>
                    <ItemsPage />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="/inventory"
                element={
                  <RoleProtectedRoute>
                    <InventoryPage />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="/history"
                element={
                  <RoleProtectedRoute>
                    <HistoryPage />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="/suppliers"
                element={
                  <RoleProtectedRoute>
                    <SuppliersPage />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="/suppliers/:supplierId"
                element={
                  <RoleProtectedRoute>
                    <SupplierDetailsPage />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="/reports"
                element={
                  <RoleProtectedRoute>
                    <ReportsPage />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="/users"
                element={
                  <RoleProtectedRoute>
                    <UsersPage />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="/requests"
                element={
                  <RoleProtectedRoute>
                    <RequestsPage />
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <RoleProtectedRoute>
                    <SettingsPage />
                  </RoleProtectedRoute>
                }
              />

            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthBootstrap>
  )
}

export default App
