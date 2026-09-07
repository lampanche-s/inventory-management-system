import type { SystemUser } from '../types/domain'

export function getRoleLabel(role: SystemUser['role']) {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return 'Administrator'
  }

  if (role === 'FUNCIONARIO') {
    return 'Employee'
  }

  return 'Requester'
}

export function getDestinationByRole(role: SystemUser['role']) {
  return role === 'SOLICITANTE' ? '/requests' : '/dashboard'
}
