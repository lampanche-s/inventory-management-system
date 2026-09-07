import { describe, expect, it } from 'vitest'
import writeXlsxFile from 'write-excel-file/node'
import { buildInventoryReportSheets } from './excelReportExporter'

const input = {
  periodLabel: 'August 2026',
  generatedAt: new Date('2026-08-24T15:00:00.000Z'),
  summary: {
    totalItems: 1,
    totalEstimatedValue: 75,
    lowStockItems: 1,
    outOfStockItems: 0,
    totalMovements: 1,
    totalEntries: 0,
    totalOutputs: 1,
    totalRequests: 1,
    pendingRequests: 0,
    approvedRequests: 1,
    rejectedRequests: 0,
    canceledRequests: 0,
  },
  items: [
    {
      code: 'ITEM-001',
      name: 'A4 paper',
      category: 'Office supplies',
      supplierName: 'Demo supplier',
      location: 'Aisle A',
      currentStock: 5,
      minimumStock: 10,
      unit: 'PCT',
      averagePrice: 15,
      estimatedValue: 75,
      status: 'LOW_STOCK',
    },
  ],
  periodMovements: [
    {
      id: '1',
      itemCode: 'ITEM-001',
      itemName: 'A4 paper',
      type: 'OUT' as const,
      quantity: 2,
      userName: 'Employee',
      createdAt: '2026-08-24T14:00:00.000Z',
      reason: 'Internal use',
    },
  ],
  periodRequests: [
    {
      id: '1',
      itemCode: 'ITEM-001',
      itemName: 'A4 paper',
      quantity: 2,
      requesterName: 'Requester',
      status: 'APPROVED' as const,
      createdAt: '2026-08-24T13:00:00.000Z',
      decisionNote: 'Approved for delivery',
    },
  ],
}

describe('buildInventoryReportSheets', () => {
  it('creates four sheets with fixed headers and the expected dimensions', () => {
    const sheets = buildInventoryReportSheets(input)

    expect(sheets.map((sheet) => sheet.sheet)).toEqual([
      'Summary',
      'Items',
      'Movements',
      'Requests',
    ])
    expect(sheets.every((sheet) => sheet.stickyRowsCount === 1)).toBe(true)
    expect(sheets[0].data[0][0]).toMatchObject({
      value: 'Metric',
      fontWeight: 'bold',
      backgroundColor: '#111827',
    })
    expect(sheets[1].columns).toHaveLength(11)
  })

  it('preserves numeric values, currency formats, and English labels', () => {
    const sheets = buildInventoryReportSheets(input)
    const summaryRows = sheets[0].data.slice(1)
    const itemRow = sheets[1].data[1]
    const movementRow = sheets[2].data[1]
    const requestRow = sheets[3].data[1]

    expect(summaryRows).toContainEqual([
      expect.objectContaining({ value: 'Current total items' }),
      expect.objectContaining({ value: 1 }),
    ])
    expect(summaryRows).toContainEqual([
      expect.objectContaining({ value: 'Selected-period movements' }),
      expect.objectContaining({ value: 1 }),
    ])
    expect(summaryRows).toContainEqual([
      expect.objectContaining({ value: 'Selected-period requests' }),
      expect.objectContaining({ value: 1 }),
    ])

    expect(itemRow[8]).toMatchObject({ value: 15, format: '"R$" #,##0.00' })
    expect(itemRow[9]).toMatchObject({ value: 75, format: '"R$" #,##0.00' })
    expect(itemRow[10]).toMatchObject({ value: 'Low stock' })
    expect(movementRow[0]).toMatchObject({ value: 'Issue' })
    expect(movementRow[5]).toMatchObject({ value: '' })
    expect(requestRow[0]).toMatchObject({ value: 'Approved' })
    expect(requestRow[5]).toMatchObject({ value: 'Approved for delivery' })
  })

  it('derives selected-period activity totals from the exported records', () => {
    const sheets = buildInventoryReportSheets({
      ...input,
      summary: {
        ...input.summary,
        totalMovements: 999,
        totalEntries: 999,
        totalOutputs: 999,
        totalRequests: 999,
        pendingRequests: 999,
        approvedRequests: 999,
        rejectedRequests: 999,
        canceledRequests: 999,
      },
    })

    const summaryRows = sheets[0].data.slice(1)

    expect(summaryRows).toContainEqual([
      expect.objectContaining({ value: 'Selected-period movements' }),
      expect.objectContaining({ value: 1 }),
    ])
    expect(summaryRows).toContainEqual([
      expect.objectContaining({ value: 'Selected-period receipts' }),
      expect.objectContaining({ value: 0 }),
    ])
    expect(summaryRows).toContainEqual([
      expect.objectContaining({ value: 'Selected-period issues' }),
      expect.objectContaining({ value: 1 }),
    ])
    expect(summaryRows).toContainEqual([
      expect.objectContaining({ value: 'Selected-period approved requests' }),
      expect.objectContaining({ value: 1 }),
    ])
  })

  it('serializes the report as a valid XLSX file', async () => {
    const file = await writeXlsxFile(buildInventoryReportSheets(input)).toBuffer()

    expect(Array.from(file.subarray(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04])
    expect(file.byteLength).toBeGreaterThan(1_000)
  })
})
