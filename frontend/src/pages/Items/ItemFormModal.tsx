import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Input, Modal, Select } from '../../components/ui'
import type {
  InventoryCategory,
  InventoryItem,
  ItemUnit,
  Supplier,
} from '../../types/domain'
import {
  brazilianDateInputToIsoDate,
  calculateDaysBetweenDateOnly,
  isoDateToBrazilianDateInput,
} from '../../utils/formatters'
import { formatBrazilianDateInput } from '../../utils/masks'

export type ItemFormSubmitData = {
  name: string
  code: string
  category: string
  unit: ItemUnit
  supplierId: string
  location: string
  currentStock: number
  minimumStock: number
  averagePrice: number
  expirationDate?: string
  expirationWarningDays?: number
}

type ItemFormModalProps = {
  open: boolean
  onClose: () => void
  onSave: (item: ItemFormSubmitData) => Promise<void> | void
  suppliers: Supplier[]
  categories?: InventoryCategory[]
  initialItem?: InventoryItem | null
  isSaving?: boolean
}

type ItemFormState = {
  name: string
  code: string
  category: string
  unit: ItemUnit
  supplierId: string
  location: string
  currentStock: string
  minimumStock: string
  averagePrice: string
  expirationDate: string
  expirationWarningDate: string
}

const initialState: ItemFormState = {
  name: '',
  code: '',
  category: '',
  unit: 'UN',
  supplierId: '',
  location: '',
  currentStock: '0',
  minimumStock: '0',
  averagePrice: '0',
  expirationDate: '',
  expirationWarningDate: '',
}

const fallbackCategories: InventoryCategory[] = [
  {
    id: 'cat-fallback-outros',
    name: 'Other',
    createdAt: new Date().toISOString(),
  },
]

const unitOptions = [
  { label: 'Unit', value: 'UN' },
  { label: 'Box', value: 'CX' },
  { label: 'Package', value: 'PCT' },
  { label: 'Pair', value: 'PAR' },
  { label: 'Kilogram', value: 'KG' },
  { label: 'Litre', value: 'L' },
]

function getStateFromItem(item?: InventoryItem | null): ItemFormState {
  if (!item) {
    return initialState
  }

  return {
    name: item.name,
    code: item.code,
    category: item.category || '',
    unit: item.unit === 'M' ? 'UN' : item.unit,
    supplierId: item.supplierId ?? '',
    location: item.location ?? '',
    currentStock: String(item.currentStock),
    minimumStock: String(item.minimumStock),
    averagePrice: String(item.averagePrice),
    expirationDate: isoDateToBrazilianDateInput(item.expirationDate),
    expirationWarningDate: isoDateToBrazilianDateInput(item.expirationWarningDate),
  }
}

function toNumber(value: string) {
  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    return 0
  }

  return parsed
}

export function ItemFormModal({
  open,
  onClose,
  onSave,
  suppliers,
  categories = [],
  initialItem,
  isSaving = false,
}: ItemFormModalProps) {
  const [form, setForm] = useState<ItemFormState>(() => getStateFromItem(initialItem))
  const [formError, setFormError] = useState('')

  const isEditing = Boolean(initialItem)

  const categoryOptions = useMemo(() => {
    const sourceCategories =
      Array.isArray(categories) && categories.length > 0
        ? categories
        : fallbackCategories

    return [
      { label: 'Select a category', value: '' },
      ...sourceCategories
        .map((category) => ({
          label: category.name,
          value: category.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ]
  }, [categories])

  const supplierOptions = useMemo(() => {
    return [
      { label: 'Select a supplier', value: '' },
      ...suppliers
        .map((supplier) => ({
          label: supplier.name,
          value: supplier.id,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ]
  }, [suppliers])

  function updateField<K extends keyof ItemFormState>(
    field: K,
    value: ItemFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setFormError('')
  }

  function resetAndClose() {
    if (isSaving) {
      return
    }

    setForm(initialState)
    setFormError('')
    onClose()
  }

  function validateForm() {
    const currentStock = toNumber(form.currentStock)
    const minimumStock = toNumber(form.minimumStock)
    const averagePrice = toNumber(form.averagePrice)
    const expirationDate = brazilianDateInputToIsoDate(form.expirationDate)
    const expirationWarningDate = brazilianDateInputToIsoDate(form.expirationWarningDate)

    if (!form.name.trim()) {
      setFormError('Enter the item name.')
      return false
    }

    if (!form.category.trim()) {
      setFormError('Select a category.')
      return false
    }

    if (!form.supplierId.trim()) {
      setFormError('Select a supplier to link to the item.')
      return false
    }

    if (!form.location.trim()) {
      setFormError('Enter the item location.')
      return false
    }

    if (!isEditing && currentStock < 0) {
      setFormError('The initial quantity cannot be negative.')
      return false
    }

    if (minimumStock < 0) {
      setFormError('Minimum stock cannot be negative.')
      return false
    }

    if (averagePrice < 0) {
      setFormError('Average price cannot be negative.')
      return false
    }

    if (form.expirationDate.trim() && !expirationDate) {
      setFormError('Enter the expiration date in DD/MM/YYYY format.')
      return false
    }

    if (form.expirationWarningDate.trim() && !expirationWarningDate) {
      setFormError('Enter the warning date in DD/MM/YYYY format.')
      return false
    }

    if (expirationWarningDate && !expirationDate) {
      setFormError('Enter the expiration date before setting a warning date.')
      return false
    }

    if (
      expirationDate &&
      expirationWarningDate &&
      calculateDaysBetweenDateOnly(expirationWarningDate, expirationDate) < 0
    ) {
      setFormError('The warning date cannot be after the expiration date.')
      return false
    }

    return true
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    const expirationDate = brazilianDateInputToIsoDate(form.expirationDate)
    const expirationWarningDate = brazilianDateInputToIsoDate(form.expirationWarningDate)

    await onSave({
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      category: form.category.trim(),
      unit: form.unit,
      supplierId: form.supplierId,
      location: form.location.trim(),
      currentStock: toNumber(form.currentStock),
      minimumStock: toNumber(form.minimumStock),
      averagePrice: toNumber(form.averagePrice),
      expirationDate: expirationDate || undefined,
      expirationWarningDays:
        expirationDate && expirationWarningDate
          ? calculateDaysBetweenDateOnly(expirationWarningDate, expirationDate)
          : undefined,
    })
  }

  return (
    <Modal
      open={open}
      title={isEditing ? 'Edit item' : 'New item'}
      description={
        isEditing
          ? 'Update the item details. Change its current balance through inventory movements.'
          : 'Create the item with an initial balance, supplier, and location.'
      }
      onClose={resetAndClose}
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button type="submit" form="item-form" disabled={isSaving}>
            {isSaving
              ? 'Saving...'
              : isEditing
                ? 'Save changes'
                : 'Save item'}
          </Button>
        </>
      }
    >
      <form id="item-form" onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Item name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Example: A4 copy paper"
            required
            disabled={isSaving}
          />
        </div>

        <Input
          label={isEditing ? 'Code / SKU' : 'Optional code / SKU'}
          value={form.code}
          onChange={(event) => updateField('code', event.target.value)}
          placeholder="Leave blank to generate automatically"
          disabled={isSaving || isEditing}
          helperText={isEditing ? 'The SKU cannot be changed while editing.' : undefined}
        />

        <Select
          label="Category"
          value={form.category}
          onChange={(event) => updateField('category', event.target.value)}
          options={categoryOptions}
          required
          disabled={isSaving}
        />

        <Select
          label="Unit"
          value={form.unit}
          onChange={(event) => updateField('unit', event.target.value as ItemUnit)}
          options={unitOptions}
          required
          disabled={isSaving}
        />

        <Select
          label="Supplier"
          value={form.supplierId}
          onChange={(event) => updateField('supplierId', event.target.value)}
          options={supplierOptions}
          required
          disabled={isSaving || suppliers.length === 0}
        />

        <div className="md:col-span-2">
          <Input
            label="Location"
            value={form.location}
            onChange={(event) => updateField('location', event.target.value)}
            placeholder="Example: Room 2, blue cabinet, top box"
            required
            disabled={isSaving}
          />
        </div>

        <Input
          label={isEditing ? 'Current balance' : 'Initial quantity'}
          type="number"
          min={0}
          step={1}
          value={form.currentStock}
          onChange={(event) => updateField('currentStock', event.target.value)}
          required
          disabled={isSaving || isEditing}
          helperText={isEditing ? 'Use inventory movements to change the balance.' : undefined}
        />

        <Input
          label="Minimum stock"
          type="number"
          min={0}
          step={1}
          value={form.minimumStock}
          onChange={(event) => updateField('minimumStock', event.target.value)}
          required
          disabled={isSaving}
        />

        <Input
          label="Average price"
          type="number"
          min={0}
          step="0.01"
          value={form.averagePrice}
          onChange={(event) => updateField('averagePrice', event.target.value)}
          required
          disabled={isSaving}
        />

        <Input
          label="Expiration date"
          value={form.expirationDate}
          onChange={(event) => updateField('expirationDate', formatBrazilianDateInput(event.target.value))}
          placeholder="DD/MM/YYYY"
          helperText="Example: 31/12/2026"
          disabled={isSaving}
        />

        <Input
          label="Warning start date"
          value={form.expirationWarningDate}
          onChange={(event) => updateField('expirationWarningDate', formatBrazilianDateInput(event.target.value))}
          placeholder="DD/MM/YYYY"
          helperText="The selected date controls alerts before expiration."
          disabled={isSaving || !form.expirationDate.trim()}
        />

        {suppliers.length === 0 && (
          <div className="md:col-span-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">
            Create at least one active supplier before adding items.
          </div>
        )}

        {formError && (
          <div className="md:col-span-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {formError}
          </div>
        )}
      </form>
    </Modal>
  )
}
