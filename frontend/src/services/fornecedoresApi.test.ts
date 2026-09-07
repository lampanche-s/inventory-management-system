import { describe, expect, it } from 'vitest'
import type { Supplier } from '../types/domain'
import {
  mapFornecedorToSupplier,
  mapSupplierToFornecedorPayload,
  type FornecedorApiResponse,
} from './fornecedoresApi'

function supplier(overrides: Partial<Omit<Supplier, 'id'>> = {}): Omit<Supplier, 'id'> {
  return {
    name: 'Local maintenance company',
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
    ...overrides,
  }
}

function apiSupplier(overrides: Partial<FornecedorApiResponse> = {}): FornecedorApiResponse {
  return {
    id: 1,
    nome: 'Local maintenance company',
    cnpj: null,
    contato: null,
    telefone: null,
    email: null,
    cidade: null,
    cep: null,
    logradouro: null,
    bairro: null,
    uf: null,
    complemento: null,
    score: 0,
    ativo: true,
    ...overrides,
  }
}

describe('supplier API mapping', () => {
  it('keeps optional supplier fields null and sends status explicitly', () => {
    expect(mapSupplierToFornecedorPayload(supplier())).toEqual({
      nome: 'Local maintenance company',
      cnpj: null,
      contato: null,
      telefone: null,
      email: null,
      cidade: null,
      cep: null,
      logradouro: null,
      bairro: null,
      uf: null,
      complemento: null,
      score: 0,
      ativo: true,
    })
  })

  it('normalizes formatted CPF/CNPJ to digits and maps inactive status', () => {
    const payload = mapSupplierToFornecedorPayload(supplier({
      document: '12.345.678/0001-90',
      status: 'INACTIVE',
    }))

    expect(payload.cnpj).toBe('12345678000190')
    expect(payload.ativo).toBe(false)
  })

  it('formats canonical CPF/CNPJ returned by the backend for presentation', () => {
    const mapped = mapFornecedorToSupplier(apiSupplier({
      cnpj: '12345678000190',
      ativo: false,
    }))

    expect(mapped.document).toBe('12.345.678/0001-90')
    expect(mapped.status).toBe('INACTIVE')
  })
})
