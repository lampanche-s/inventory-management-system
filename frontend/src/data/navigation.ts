import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  FileText,
  History,
  Settings,
  Truck,
  UsersRound,
} from 'lucide-react'
import type { SystemUser } from '../types/domain'

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
  description: string
  badge?: string
  allowedRoles: SystemUser['role'][]
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: BarChart3,
    description: 'Inventory overview',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FUNCIONARIO'],
  },
  {
    label: 'Items',
    path: '/items',
    icon: Boxes,
    description: 'Item catalog and management',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FUNCIONARIO'],
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: ClipboardList,
    description: 'Balances, receipts, and issues',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FUNCIONARIO'],
  },
  {
    label: 'History',
    path: '/history',
    icon: History,
    description: 'Recorded stock movements',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FUNCIONARIO'],
  },
  {
    label: 'Suppliers',
    path: '/suppliers',
    icon: Truck,
    description: 'Supplier records',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FUNCIONARIO'],
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: FileText,
    description: 'Analysis and exports',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FUNCIONARIO'],
  },
  {
    label: 'Users',
    path: '/users',
    icon: UsersRound,
    description: 'Roles, permissions, and access',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FUNCIONARIO'],
  },
  {
    label: 'Requests',
    path: '/requests',
    icon: Bell,
    description: 'Requests and approvals',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'FUNCIONARIO', 'SOLICITANTE'],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    description: 'System administration',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
  },
]
