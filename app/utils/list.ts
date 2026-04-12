export type SortOptionKind = 'date' | 'text' | 'number'

export type SortFieldOption = {
  label: string
  value: string
  kind: SortOptionKind
}

export const defaultPageSizeOptions = [10, 25, 50, 100] as const

export function getSortOrderOptions(kind: SortOptionKind) {
  if (kind === 'date') {
    return [
      { label: 'Terlama', value: 'asc' },
      { label: 'Terbaru', value: 'desc' },
    ] as const
  }

  if (kind === 'number') {
    return [
      { label: 'Kecil ke besar', value: 'asc' },
      { label: 'Besar ke kecil', value: 'desc' },
    ] as const
  }

  return [
    { label: 'A - Z', value: 'asc' },
    { label: 'Z - A', value: 'desc' },
  ] as const
}

export function getPageRangeLabel(page: number, limit: number, total: number) {
  if (total <= 0) {
    return '0 Dari 0'
  }

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  return `${start}-${end} Dari ${total}`
}
