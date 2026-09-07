import type { Cell, SheetData } from 'write-excel-file/browser'
import type {
  InventoryMovement,
  StockRequest,
} from '../types/domain'
import { formatDateTime } from './formatters'

type ReportSummary = {
  totalItems: number
  totalEstimatedValue: number
  lowStockItems: number
  outOfStockItems: number
  totalMovements: number
  totalEntries: number
  totalOutputs: number
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  canceledRequests: number
}

type ReportItem = {
  code: string
  name: string
  category: string
  supplierName: string
  location: string
  currentStock: number
  minimumStock: number
  unit: string
  averagePrice: number
  estimatedValue: number
  status: string
}

export type ReportWorkbookInput = {
  periodLabel: string
  summary: ReportSummary
  items: ReportItem[]
  periodMovements: InventoryMovement[]
  periodRequests: StockRequest[]
  generatedAt?: Date
}

type DownloadReportXlsxInput = ReportWorkbookInput & { filename: string }

type ReportCellValue = string | number

const HEADER_STYLE = {
  fontWeight: 'bold',
  textColor: '#FFFFFF',
  backgroundColor: '#111827',
  align: 'center',
  alignVertical: 'center',
  height: 24,
  wrap: true,
} as const

function statusLabel(status: string) {
  if (status === 'NORMAL') return 'Normal'
  if (status === 'LOW_STOCK') return 'Low stock'
  if (status === 'OUT_OF_STOCK') return 'Out of stock'
  if (status === 'PENDING') return 'Pending'
  if (status === 'APPROVED') return 'Approved'
  if (status === 'REJECTED') return 'Rejected'
  if (status === 'CANCELED') return 'Canceled'

  return status
}

function movementTypeLabel(type: string) {
  return type === 'IN' ? 'Receipt' : 'Issue'
}

function createSheetData(
  headers: string[],
  rows: ReportCellValue[][],
  formats: Partial<Record<number, string>> = {},
): SheetData {
  const header = headers.map<Cell>((value) => ({
    value,
    type: String,
    ...HEADER_STYLE,
  }))

  const data = rows.map((row) =>
    row.map<Cell>((value, columnIndex) => ({
      value,
      type: typeof value === 'number' ? Number : String,
      alignVertical: 'center',
      wrap: true,
      ...(typeof value === 'number' && formats[columnIndex]
        ? { format: formats[columnIndex] }
        : {}),
    })),
  )

  return [header, ...data]
}

export function buildInventoryReportSheets({
  periodLabel,
  summary,
  items,
  periodMovements,
  periodRequests,
  generatedAt = new Date(),
}: ReportWorkbookInput) {
  const periodActivitySummary = {
    totalMovements: periodMovements.length,
    totalEntries: periodMovements.filter((movement) => movement.type === 'IN').length,
    totalOutputs: periodMovements.filter((movement) => movement.type === 'OUT').length,
    totalRequests: periodRequests.length,
    pendingRequests: periodRequests.filter((request) => request.status === 'PENDING').length,
    approvedRequests: periodRequests.filter((request) => request.status === 'APPROVED').length,
    rejectedRequests: periodRequests.filter((request) => request.status === 'REJECTED').length,
    canceledRequests: periodRequests.filter((request) => request.status === 'CANCELED').length,
  }

  const sheets = [
    {
      sheet: 'Summary',
      stickyRowsCount: 1,
      columns: [{ width: 34 }, { width: 24 }],
      data: createSheetData(
        ['Metric', 'Value'],
        [
          ['Selected period', periodLabel],
          ['Generated at', formatDateTime(generatedAt.toISOString())],
          ['Current total items', summary.totalItems],
          ['Current estimated inventory value', summary.totalEstimatedValue],
          ['Current low-stock items', summary.lowStockItems],
          ['Current out-of-stock items', summary.outOfStockItems],
          ['Selected-period movements', periodActivitySummary.totalMovements],
          ['Selected-period receipts', periodActivitySummary.totalEntries],
          ['Selected-period issues', periodActivitySummary.totalOutputs],
          ['Selected-period requests', periodActivitySummary.totalRequests],
          ['Selected-period pending requests', periodActivitySummary.pendingRequests],
          ['Selected-period approved requests', periodActivitySummary.approvedRequests],
          ['Selected-period rejected requests', periodActivitySummary.rejectedRequests],
          ['Selected-period canceled requests', periodActivitySummary.canceledRequests],
        ],
        { 1: '#,##0.00' },
      ),
    },
    {
      sheet: 'Items',
      stickyRowsCount: 1,
      columns: [18, 34, 22, 30, 34, 16, 16, 12, 16, 18, 18].map((width) => ({ width })),
      data: createSheetData(
        [
          'Code',
          'Item',
          'Category',
          'Supplier',
          'Location',
          'Current stock',
          'Minimum stock',
          'Unit',
          'Average price',
          'Estimated value',
          'Status',
        ],
        items.map((item) => [
          item.code,
          item.name,
          item.category,
          item.supplierName,
          item.location,
          item.currentStock,
          item.minimumStock,
          item.unit,
          item.averagePrice,
          item.estimatedValue,
          statusLabel(item.status),
        ]),
        { 8: '"R$" #,##0.00', 9: '"R$" #,##0.00' },
      ),
    },
    {
      sheet: 'Movements',
      stickyRowsCount: 1,
      columns: [14, 18, 34, 14, 26, 26, 46, 22].map((width) => ({ width })),
      data: createSheetData(
        ['Type', 'Code', 'Item', 'Quantity', 'Recorded by', 'Requester', 'Reason / note', 'Date'],
        periodMovements.map((movement) => [
          movementTypeLabel(movement.type),
          movement.itemCode,
          movement.itemName,
          movement.quantity,
          movement.userName,
          movement.requesterName ?? '',
          movement.reason,
          formatDateTime(movement.createdAt),
        ]),
      ),
    },
    {
      sheet: 'Requests',
      stickyRowsCount: 1,
      columns: [16, 18, 34, 14, 26, 46, 26, 22, 22].map((width) => ({ width })),
      data: createSheetData(
        [
          'Status',
          'Code',
          'Item',
          'Quantity',
          'Requester',
          'Reason / decision note',
          'Decided by',
          'Created at',
          'Decided at',
        ],
        periodRequests.map((request) => [
          statusLabel(request.status),
          request.itemCode,
          request.itemName,
          request.quantity,
          request.requesterName,
          request.requestReason || request.decisionNote || '',
          request.decidedByName ?? '',
          formatDateTime(request.createdAt),
          request.decidedAt ? formatDateTime(request.decidedAt) : '',
        ]),
      ),
    },
  ]

  return sheets
}

export async function downloadInventoryReportXlsx({
  filename,
  ...report
}: DownloadReportXlsxInput) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')

  await writeXlsxFile(buildInventoryReportSheets(report)).toFile(filename)
}
