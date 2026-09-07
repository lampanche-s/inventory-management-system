import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Input, ItemSearchSelect, Modal, Select } from '../../components/ui'
import type {
  InventoryItem,
  MovementType,
} from '../../types/domain'
import type { BackendMotivoMovimentacao } from '../../services/movimentacoesApi'

export type MovementFormSubmitData = {
  itemId: string
  type: MovementType
  quantity: number
  motivo: BackendMotivoMovimentacao
  requesterName?: string
  observacao?: string
}

type MovementFormModalProps = {
  open: boolean
  items: InventoryItem[]
  defaultType: MovementType
  defaultItemId?: string
  onClose: () => void
  onSave: (input: MovementFormSubmitData) => Promise<void> | void
  isSaving?: boolean
  selectedItem?: InventoryItem | null
  onItemSearch?: (term: string) => void
  isSearchingItems?: boolean
  itemSearchError?: string
}

type MovementFormState = {
  itemId: string
  type: MovementType
  quantity: string
  motivo: BackendMotivoMovimentacao
  requesterName: string
  observacao: string
}

const motivosEntrada = [
  { label: 'Stock replenishment', value: 'REPOSICAO_ESTOQUE' },
  { label: 'Return', value: 'DEVOLUCAO' },
  { label: 'Inventory adjustment', value: 'AJUSTE_INVENTARIO' },
]

const motivosSaida = [
  { label: 'Internal use', value: 'USO_INTERNO' },
  { label: 'Department transfer', value: 'TRANSFERENCIA_SETOR' },
  { label: 'Inventory adjustment', value: 'AJUSTE_INVENTARIO' },
  { label: 'Loss / damage', value: 'PERDA_AVARIA' },
]

function getDefaultMotivo(type: MovementType): BackendMotivoMovimentacao {
  return type === 'IN' ? 'REPOSICAO_ESTOQUE' : 'USO_INTERNO'
}

function createInitialState(
  defaultType: MovementType,
  defaultItemId: string | undefined,
): MovementFormState {
  return {
    itemId: defaultItemId ?? '',
    type: defaultType,
    quantity: '1',
    motivo: getDefaultMotivo(defaultType),
    requesterName: '',
    observacao: '',
  }
}

export function MovementFormModal({
  open,
  items,
  defaultType,
  defaultItemId,
  onClose,
  onSave,
  isSaving = false,
  selectedItem: selectedItemProp = null,
  onItemSearch,
  isSearchingItems = false,
  itemSearchError = '',
}: MovementFormModalProps) {
  const [form, setForm] = useState<MovementFormState>(() =>
    createInitialState(defaultType, defaultItemId),
  )
  const [error, setError] = useState('')

  const selectedItem = useMemo(() => {
    return selectedItemProp ?? items.find((item) => item.id === form.itemId)
  }, [items, selectedItemProp, form.itemId])

  const motivoOptions = useMemo(() => {
    return form.type === 'IN' ? motivosEntrada : motivosSaida
  }, [form.type])

  function updateField<K extends keyof MovementFormState>(
    field: K,
    value: MovementFormState[K],
  ) {
    setForm((current) => {
      if (field === 'type') {
        const nextType = value as MovementType

        return {
          ...current,
          type: nextType,
          motivo: getDefaultMotivo(nextType),
          requesterName: nextType === 'OUT' ? current.requesterName : '',
        }
      }

      return {
        ...current,
        [field]: value,
      }
    })

    setError('')
  }

  function resetForm() {
    setForm(createInitialState(defaultType, defaultItemId))
    setError('')
  }

  function resetAndClose() {
    if (isSaving) {
      return
    }

    resetForm()
    onClose()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const quantity = Number(form.quantity)
    const requesterName = form.requesterName.trim()

    if (!form.itemId) {
      setError('Select an item.')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Enter a quantity greater than zero.')
      return
    }

    if (form.type === 'OUT' && !requesterName) {
      setError('Enter the requester or the person collecting the item.')
      return
    }

    if (form.type === 'OUT' && selectedItem && quantity > selectedItem.currentStock) {
      setError(`Insufficient balance. Current balance: ${selectedItem.currentStock}.`)
      return
    }

    await onSave({
      itemId: form.itemId,
      type: form.type,
      quantity,
      motivo: form.motivo,
      requesterName: form.type === 'OUT' ? requesterName : undefined,
      observacao: form.observacao.trim() || undefined,
    })

    resetForm()
  }

  return (
    <Modal
      open={open}
      title={form.type === 'IN' ? 'Record receipt' : 'Record issue'}
      description="Update the item balance while preserving the movement history."
      onClose={resetAndClose}
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button type="submit" form="movement-form" disabled={isSaving}>
            {isSaving ? 'Recording...' : 'Confirm movement'}
          </Button>
        </>
      }
    >
      <form id="movement-form" onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <ItemSearchSelect
            label="Item"
            items={items}
            value={form.itemId}
            onChange={(itemId) => updateField('itemId', itemId)}
            required
            maxResults={8}
            selectedItem={selectedItem}
            onSearch={onItemSearch}
            isSearching={isSearchingItems}
            searchError={itemSearchError}
            disabled={isSaving}
            helperText="Enter at least 2 characters. The search checks all registered items, regardless of the current page."
          />
        </div>

        <Select
          label="Movement type"
          value={form.type}
          onChange={(event) => updateField('type', event.target.value as MovementType)}
          options={[
            { label: 'Receipt', value: 'IN' },
            { label: 'Issue', value: 'OUT' },
          ]}
          required
          disabled={isSaving}
        />

        <Input
          label="Quantity"
          type="number"
          min={1}
          step={1}
          value={form.quantity}
          onChange={(event) => updateField('quantity', event.target.value)}
          required
          disabled={isSaving}
        />

        <div className="md:col-span-2">
          <Select
            label="Reason"
            value={form.motivo}
            onChange={(event) => updateField('motivo', event.target.value as BackendMotivoMovimentacao)}
            options={motivoOptions}
            required
            disabled={isSaving}
          />
        </div>

        {form.type === 'OUT' && (
          <div className="md:col-span-2">
            <Input
              label="Requester / collected by"
              value={form.requesterName}
              onChange={(event) => updateField('requesterName', event.target.value)}
              placeholder="Example: Facilities team, contractor, or visitor..."
              required
              disabled={isSaving}
              helperText="Record who requested or collected the material."
            />
          </div>
        )}

        <div className="md:col-span-2">
          <Input
            label="Optional note"
            value={form.observacao}
            onChange={(event) => updateField('observacao', event.target.value)}
            placeholder="Example: monthly replenishment, external delivery, inventory adjustment..."
            maxLength={500}
            disabled={isSaving}
            helperText={`Maximum 500 characters. ${form.observacao.length}/500 used.`}
          />
        </div>

        {selectedItem && (
          <div className="md:col-span-2 rounded-3xl border border-nexus-border bg-white/[0.035] p-5">
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Selected item: {selectedItem.name}
            </p>
          </div>
        )}

        {error && (
          <div className="md:col-span-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {error}
          </div>
        )}
      </form>
    </Modal>
  )
}
