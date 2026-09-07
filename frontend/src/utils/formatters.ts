const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const BRAZILIAN_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDateOnly(value?: string | null) {
  if (!value) {
    return '-'
  }

  const isoMatch = value.match(DATE_ONLY_PATTERN)

  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${day}/${month}/${year}`
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB').format(date)
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function isoDateToBrazilianDateInput(value?: string | null) {
  if (!value) {
    return ''
  }

  const isoMatch = value.match(DATE_ONLY_PATTERN)

  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${day}/${month}/${year}`
  }

  return formatDateOnly(value)
}

export function brazilianDateInputToIsoDate(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  const isoMatch = trimmed.match(DATE_ONLY_PATTERN)

  if (isoMatch) {
    return trimmed
  }

  const brMatch = trimmed.match(BRAZILIAN_DATE_PATTERN)

  if (!brMatch) {
    return ''
  }

  const [, day, month, year] = brMatch
  const isoDate = `${year}-${month}-${day}`

  const date = new Date(`${isoDate}T00:00:00`)

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  ) {
    return ''
  }

  return isoDate
}

function dateOnlyToUtcTime(value: string) {
  const match = value.match(DATE_ONLY_PATTERN)

  if (!match) {
    return Number.NaN
  }

  const [, year, month, day] = match

  return Date.UTC(Number(year), Number(month) - 1, Number(day))
}

export function calculateDaysBetweenDateOnly(startIsoDate: string, endIsoDate: string) {
  const start = dateOnlyToUtcTime(startIsoDate)
  const end = dateOnlyToUtcTime(endIsoDate)

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 0
  }

  const dayInMs = 24 * 60 * 60 * 1000

  return Math.max(0, Math.round((end - start) / dayInMs))
}

export function subtractDaysFromDateOnly(isoDate: string, days: number) {
  const time = dateOnlyToUtcTime(isoDate)

  if (Number.isNaN(time)) {
    return ''
  }

  const date = new Date(time)
  date.setUTCDate(date.getUTCDate() - Math.max(days, 0))

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}
