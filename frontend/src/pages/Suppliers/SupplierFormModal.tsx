import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Input, Modal, Select } from '../../components/ui'
import type { Supplier } from '../../types/domain'
import {
  formatBrazilianPhone,
  formatCep,
  formatCpfCnpj,
  onlyDigits,
} from '../../utils/masks'

export type SupplierFormSubmitData = Omit<Supplier, 'id'>

type SupplierFormModalProps = {
  open: boolean
  onClose: () => void
  onSave: (supplier: SupplierFormSubmitData) => Promise<void> | void
  initialSupplier?: Supplier | null
  isSaving?: boolean
}

type SupplierFormState = SupplierFormSubmitData

type CepResponse = {
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

const initialState: SupplierFormState = {
  name: '',
  document: '',
  phone: '',
  email: '',
  cep: '',
  address: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  status: 'ACTIVE',
}

function getStateFromSupplier(supplier?: Supplier | null): SupplierFormState {
  if (!supplier) {
    return initialState
  }

  return {
    name: supplier.name,
    document: formatCpfCnpj(supplier.document),
    phone: formatBrazilianPhone(supplier.phone),
    email: supplier.email,
    cep: formatCep(supplier.cep ?? ''),
    address: supplier.address ?? '',
    number: supplier.number ?? '',
    neighborhood: supplier.neighborhood ?? '',
    city: supplier.city ?? '',
    state: supplier.state ?? '',
    status: supplier.status,
  }
}

export function SupplierFormModal({
  open,
  onClose,
  onSave,
  initialSupplier,
  isSaving = false,
}: SupplierFormModalProps) {
  const [form, setForm] = useState<SupplierFormState>(() => getStateFromSupplier(initialSupplier))
  const [cepStatus, setCepStatus] = useState('')
  const [formError, setFormError] = useState('')
  const [isSearchingCep, setIsSearchingCep] = useState(false)

  const isEditing = Boolean(initialSupplier)

  function updateField<K extends keyof SupplierFormState>(
    field: K,
    value: SupplierFormState[K],
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
    setCepStatus('')
    setFormError('')
    setIsSearchingCep(false)
    onClose()
  }

  async function searchCep() {
    const cepNumbers = onlyDigits(form.cep)

    if (cepNumbers.length !== 8) {
      setCepStatus('')
      return
    }

    try {
      setIsSearchingCep(true)
      setCepStatus('Looking up address...')

      const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`)
      const data = (await response.json()) as CepResponse

      if (!response.ok || data.erro) {
        setCepStatus('Postal code not found. Enter the address manually.')
        return
      }

      setForm((current) => ({
        ...current,
        cep: formatCep(data.cep ?? current.cep),
        address: data.logradouro ?? current.address,
        neighborhood: data.bairro ?? current.neighborhood,
        city: data.localidade ?? current.city,
        state: data.uf ?? current.state,
      }))

      setCepStatus('Address filled automatically.')
    } catch {
      setCepStatus('Could not look up the postal code. Enter the address manually.')
    } finally {
      setIsSearchingCep(false)
    }
  }

  function validateForm() {
    if (!form.name.trim()) {
      setFormError('Enter the supplier name.')
      return false
    }

    const documentDigits = onlyDigits(form.document)
    if (documentDigits.length > 0 && documentDigits.length !== 11 && documentDigits.length !== 14) {
      setFormError('Enter a valid Brazilian CPF or CNPJ or leave the field blank.')
      return false
    }

    const phoneDigits = onlyDigits(form.phone)
    if (phoneDigits.length > 0 && phoneDigits.length < 10) {
      setFormError('Enter a valid phone number or leave the field blank.')
      return false
    }

    if (form.email.trim() && !form.email.includes('@')) {
      setFormError('Enter a valid email address or leave the field blank.')
      return false
    }

    const cepDigits = onlyDigits(form.cep)
    if (cepDigits.length > 0 && cepDigits.length !== 8) {
      setFormError('Enter a valid Brazilian postal code (CEP) or leave the field blank.')
      return false
    }

    const state = form.state.trim()
    if (state && state.length !== 2) {
      setFormError('Enter a valid two-letter state code or leave the field blank.')
      return false
    }

    return true
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    await onSave({
      name: form.name.trim(),
      document: formatCpfCnpj(form.document),
      phone: formatBrazilianPhone(form.phone),
      email: form.email.trim(),
      cep: formatCep(form.cep),
      address: form.address.trim(),
      number: form.number.trim(),
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      status: form.status,
    })
  }

  return (
    <Modal
      open={open}
      title={isEditing ? 'Edit supplier' : 'New supplier'}
      description={
        isEditing
          ? 'Update the supplier registration, contact, and address details.'
          : 'Create a supplier to link to inventory items.'
      }
      onClose={resetAndClose}
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button type="submit" form="supplier-form" disabled={isSaving || isSearchingCep}>
            {isSaving
              ? 'Saving...'
              : isEditing
                ? 'Save changes'
                : 'Save supplier'}
          </Button>
        </>
      }
    >
      <form id="supplier-form" onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Supplier name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Example: Northstar Supplies"
            required
            disabled={isSaving}
          />
        </div>

        <Input
          label="CPF / CNPJ"
          value={form.document}
          onChange={(event) => updateField('document', formatCpfCnpj(event.target.value))}
          placeholder="Numbers only"
          inputMode="numeric"
          disabled={isSaving}
        />

        <Input
          label="Phone"
          value={form.phone}
          onChange={(event) => updateField('phone', formatBrazilianPhone(event.target.value))}
          placeholder="Numbers only"
          inputMode="numeric"
          disabled={isSaving}
        />

        <Input
          label="Optional email"
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          placeholder="Example: sales@supplier.example"
          disabled={isSaving}
        />

        <Input
          label="Postal code (CEP)"
          value={form.cep}
          onChange={(event) => updateField('cep', formatCep(event.target.value))}
          onBlur={searchCep}
          placeholder="Numbers only"
          inputMode="numeric"
          helperText={
            cepStatus ||
            'Enter the CEP and leave the field to fill the address automatically.'
          }
          disabled={isSaving || isSearchingCep}
        />

        <div className="md:col-span-2">
          <Input
            label="Address"
            value={form.address}
            onChange={(event) => updateField('address', event.target.value)}
            placeholder="Example: Main Avenue"
            disabled={isSaving}
          />
        </div>

        <Input
          label="Number / additional details"
          value={form.number}
          onChange={(event) => updateField('number', event.target.value)}
          placeholder="Example: 120, suite 2"
          disabled={isSaving}
        />

        <Input
          label="District"
          value={form.neighborhood}
          onChange={(event) => updateField('neighborhood', event.target.value)}
          placeholder="Example: Downtown"
          disabled={isSaving}
        />

        <Input
          label="City"
          value={form.city}
          onChange={(event) => updateField('city', event.target.value)}
          placeholder="Example: Salvador"
          disabled={isSaving}
        />

        <Input
          label="UF"
          value={form.state}
          onChange={(event) => updateField('state', event.target.value.toUpperCase().slice(0, 2))}
          placeholder="Ex: BA"
          maxLength={2}
          disabled={isSaving}
        />

        <Select
          label="Status"
          value={form.status}
          onChange={(event) => updateField('status', event.target.value as Supplier['status'])}
          options={[
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Inactive', value: 'INACTIVE' },
          ]}
          required
          disabled={isSaving}
        />

        <div className="md:col-span-2 rounded-3xl border border-nexus-border bg-white/[0.035] p-5">
          <p className="font-semibold text-white">
            Supplier record
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            These details are used for item records, inventory queries, and purchasing organization.
          </p>
        </div>

        {formError && (
          <div className="md:col-span-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {formError}
          </div>
        )}
      </form>
    </Modal>
  )
}
