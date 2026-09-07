import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Plus,
  Trash2,
} from 'lucide-react'
import {
  Button,
  Input,
  ItemSearchSelect,
  Modal,
  Select,
  Textarea,
} from '../../components/ui'
import type {
  InventoryItem,
} from '../../types/domain'
import type { BackendMotivoMovimentacao } from '../../services/movimentacoesApi'

export type RequestFormItemSubmitData = {
  itemId: string
  quantity: number
}

export type RequestFormSubmitData = {
  itens: RequestFormItemSubmitData[]
  motivo: BackendMotivoMovimentacao
  observacao: string
}

type RequestFormModalProps = {
  open: boolean
  items: InventoryItem[]
  requesterName: string
  onClose: () => void
  onSave: (request: RequestFormSubmitData) => Promise<void> | void
  isSaving?: boolean
  selectedItem?: InventoryItem | null
  onItemSearch?: (term: string) => void
  isSearchingItems?: boolean
  itemSearchError?: string
  isRequester?: boolean
}

type DraftItemState = {
  itemId: string
  quantity: string
}

type AddedRequestItem = {
  item: InventoryItem
  quantity: number
}

type RequestFormState = {
  motivo: BackendMotivoMovimentacao
  observacao: string
}

const initialDraftItem: DraftItemState = {
  itemId: '',
  quantity: '1',
}

const initialState: RequestFormState = {
  motivo: 'USO_INTERNO',
  observacao: '',
}

const REQUEST_ITEMS_LIMIT = 10

const motivosSolicitacao = [
  { label: 'Internal use', value: 'USO_INTERNO' },
  { label: 'Department transfer', value: 'TRANSFERENCIA_SETOR' },
  { label: 'Inventory adjustment', value: 'AJUSTE_INVENTARIO' },
  { label: 'Loss / damage', value: 'PERDA_AVARIA' },
]

export function RequestFormModal({
  open,
  items,
  requesterName,
  onClose,
  onSave,
  isSaving = false,
  selectedItem: selectedItemProp = null,
  onItemSearch,
  isSearchingItems = false,
  itemSearchError = '',
  isRequester = false,
}: RequestFormModalProps) {
  const [form, setForm] = useState<RequestFormState>(initialState)
  const [draftItem, setDraftItem] = useState<DraftItemState>(initialDraftItem)
  const [addedItems, setAddedItems] = useState<AddedRequestItem[]>([])
  const [error, setError] = useState('')

  const selectedItem = useMemo(() => {
    return selectedItemProp ?? items.find((item) => item.id === draftItem.itemId)
  }, [items, selectedItemProp, draftItem.itemId])

  const hasReachedLimit = addedItems.length >= REQUEST_ITEMS_LIMIT

  function updateFormField<K extends keyof RequestFormState>(
    field: K,
    value: RequestFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setError('')
  }

  function updateDraftItem<K extends keyof DraftItemState>(
    field: K,
    value: DraftItemState[K],
  ) {
    setDraftItem((current) => ({
      ...current,
      [field]: value,
    }))

    setError('')
  }

  function resetForm() {
    setForm(initialState)
    setDraftItem(initialDraftItem)
    setAddedItems([])
    setError('')
  }

  function resetAndClose() {
    if (isSaving) {
      return
    }

    resetForm()
    onClose()
  }

  function addItemToRequest() {
    const quantity = Number(draftItem.quantity)

    if (hasReachedLimit) {
      setError('A request can contain up to 10 items.')
      return
    }

    if (!draftItem.itemId || !selectedItem) {
      setError('Select an item to add to the request.')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Enter a quantity greater than zero.')
      return
    }

    if (addedItems.some((addedItem) => addedItem.item.id === selectedItem.id)) {
      setError('This item has already been added to the request.')
      return
    }

    setAddedItems((current) => [
      ...current,
      {
        item: selectedItem,
        quantity,
      },
    ])
    setDraftItem(initialDraftItem)
    setError('')
  }

  function removeItemFromRequest(itemId: string) {
    if (isSaving) {
      return
    }

    setAddedItems((current) => current.filter((addedItem) => addedItem.item.id !== itemId))
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const observacao = form.observacao.trim()

    if (addedItems.length === 0) {
      setError('Add at least one item to the request.')
      return
    }

    if (addedItems.length > REQUEST_ITEMS_LIMIT) {
      setError('A request can contain up to 10 items.')
      return
    }

    if (!observacao) {
      setError('Explain the reason for the request.')
      return
    }

    await onSave({
      itens: addedItems.map((addedItem) => ({
        itemId: addedItem.item.id,
        quantity: addedItem.quantity,
      })),
      motivo: form.motivo,
      observacao,
    })

    resetForm()
  }

  return (
    <Modal
      open={open}
      title="New request"
      description="Build a request with up to 10 items for review."
      onClose={resetAndClose}
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button type="submit" form="request-form" disabled={isSaving}>
            {isSaving ? 'Submitting...' : 'Create request'}
          </Button>
        </>
      }
    >
      <form id="request-form" onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2 rounded-3xl border border-nexus-border bg-white/[0.035] p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-white">Requested items</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {addedItems.length} of {REQUEST_ITEMS_LIMIT} items added
              </p>
            </div>

            {hasReachedLimit && (
              <span className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold tracking-normal text-amber-300">
                Limit reached
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_150px]">
            <ItemSearchSelect
              label="Item"
              items={items}
              value={draftItem.itemId}
              onChange={(itemId) => updateDraftItem('itemId', itemId)}
              hideStockInfo
              showStock={false}
              showCode={!isRequester}
              maxResults={15}
              selectedItem={selectedItem}
              onSearch={onItemSearch}
              isSearching={isSearchingItems}
              searchError={itemSearchError}
              disabled={isSaving || hasReachedLimit}
              placeholder={isRequester ? 'Enter the item name...' : 'Enter an item code or name...'}
              helperText={
                isRequester
                  ? 'Enter at least 2 characters. Search uses the names of items available for requests.'
                  : 'Enter at least 2 characters. Search includes only items available for requests.'
              }
            />

            <Input
              label="Quantity"
              type="number"
              min={1}
              step={1}
              value={draftItem.quantity}
              onChange={(event) => updateDraftItem('quantity', event.target.value)}
              disabled={isSaving || hasReachedLimit}
            />
          </div>

          {selectedItem && (
            <div className="mt-4 rounded-2xl border border-nexus-border bg-white/[0.035] px-4 py-3">
              <p className="text-sm font-semibold text-white">
                {isRequester ? selectedItem.name : `${selectedItem.code} · ${selectedItem.name}`}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Selected for inclusion in the request.
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={addItemToRequest}
              disabled={isSaving || hasReachedLimit}
            >
              <Plus size={16} />
              Add item
            </Button>
          </div>
        </div>

        {addedItems.length > 0 && (
          <div className="md:col-span-2 overflow-hidden rounded-3xl border border-nexus-border bg-white/[0.035]">
            <div className="border-b border-nexus-border px-5 py-4">
              <p className="font-semibold text-white">Request summary</p>
            </div>

            <div className="divide-y divide-nexus-border">
              {addedItems.map((addedItem, index) => (
                <div
                  key={addedItem.item.id}
                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {index + 1}. {isRequester ? addedItem.item.name : `${addedItem.item.code} · ${addedItem.item.name}`}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Quantity entered by the requester.
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                    <span className="rounded-lg border border-nexus-border bg-white/[0.045] px-3 py-2 text-sm font-bold text-white">
                      Qty. {addedItem.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItemFromRequest(addedItem.item.id)}
                      disabled={isSaving}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Remove ${addedItem.item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Input
          label="Requester"
          value={requesterName}
          disabled
          helperText="Identified automatically from the signed-in account."
        />

        <Select
          label="Reason"
          value={form.motivo}
          onChange={(event) => updateFormField('motivo', event.target.value as BackendMotivoMovimentacao)}
          options={motivosSolicitacao}
          required
          disabled={isSaving}
        />

        <div className="md:col-span-2">
          <Textarea
            label="Request note"
            value={form.observacao}
            onChange={(event) => updateFormField('observacao', event.target.value)}
            placeholder="Explain why these materials are being requested."
            maxLength={500}
            helperText={`This note applies to every item in the request. ${form.observacao.length}/500 characters.`}
            required
            disabled={isSaving}
          />
        </div>

        {error && (
          <div className="md:col-span-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {error}
          </div>
        )}
      </form>
    </Modal>
  )
}
