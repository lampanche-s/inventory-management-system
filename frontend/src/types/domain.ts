export type ItemStatus = 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export type ItemCategory = string

export type InventoryCategory = {
  id: string
  name: string
  createdAt: string
}

export type ItemUnit =
  | 'UN'
  | 'CX'
  | 'PCT'
  | 'PAR'
  | 'KG'
  | 'L'
  | 'M'

export type InventoryItem = {
  id: string
  code: string
  name: string
  category: ItemCategory
  unit: ItemUnit
  currentStock: number
  minimumStock: number
  averagePrice: number
  supplierId?: string | null
  supplierName: string
  aisle: string
  shelf: string
  location: string
  expirationDate?: string
  expirationWarningDate?: string
  status: ItemStatus
  updatedAt: string
}

export type Supplier = {
  id: string
  name: string
  document: string
  phone: string
  email: string
  cep: string
  address: string
  number: string
  neighborhood: string
  city: string
  state: string
  status: 'ACTIVE' | 'INACTIVE'
}

export type MovementType = 'IN' | 'OUT'

export type InventoryMovement = {
  id: string
  itemCode: string
  itemName: string
  type: MovementType
  quantity: number
  userName: string
  requesterName?: string
  createdAt: string
  reason: string
}

export type SystemUser = {
  id: string
  name: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'FUNCIONARIO' | 'SOLICITANTE'
  status: 'ACTIVE' | 'INACTIVE'
  lastSeen: string
  passwordSet: boolean
  passwordUpdatedAt?: string
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED'

export type StockRequest = {
  id: string
  itemCode: string
  itemName: string
  quantity: number
  requesterId?: string
  requesterName: string
  requestReason?: string
  requestBatchCode?: string
  requestBatchOrder?: number
  status: RequestStatus
  createdAt: string
  decisionNote?: string
  decidedByName?: string
  decidedAt?: string
}

export type SystemHistoryArea =
  | 'ITEMS'
  | 'STOCK'
  | 'SUPPLIERS'
  | 'CATEGORIES'
  | 'REQUESTS'

export type SystemHistoryType =
  | 'ITEM_CREATED'
  | 'ITEM_UPDATED'
  | 'ITEM_DELETED'
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'SUPPLIER_CREATED'
  | 'SUPPLIER_UPDATED'
  | 'SUPPLIER_DELETED'
  | 'SUPPLIER_LINKED'
  | 'SUPPLIER_UNLINKED'
  | 'CATEGORY_CREATED'
  | 'CATEGORY_DELETED'
  | 'CATEGORY_LINKED'
  | 'CATEGORY_UNLINKED'
  | 'REQUEST_CREATED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_CANCELED'

export type SystemHistoryEvent = {
  id: string
  type: SystemHistoryType
  area: SystemHistoryArea
  title: string
  description: string
  actorName: string
  entityId?: string
  entityName?: string
  createdAt: string
}

export type CreateSystemHistoryEventInput = Omit<SystemHistoryEvent, 'id' | 'createdAt'>
