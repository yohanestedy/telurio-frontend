import { getCurrentLanguage, translateMessage } from './i18n'

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
      { label: translateMessage(getCurrentLanguage(), 'sort.oldest'), value: 'asc' },
      { label: translateMessage(getCurrentLanguage(), 'sort.newest'), value: 'desc' },
    ] as const
  }

  if (kind === 'number') {
    return [
      { label: translateMessage(getCurrentLanguage(), 'sort.smallToLarge'), value: 'asc' },
      { label: translateMessage(getCurrentLanguage(), 'sort.largeToSmall'), value: 'desc' },
    ] as const
  }

  return [
    { label: 'A - Z', value: 'asc' },
    { label: 'Z - A', value: 'desc' },
  ] as const
}

export function getPageRangeLabel(page: number, limit: number, total: number) {
  if (total <= 0) {
    return `0 ${translateMessage(getCurrentLanguage(), 'common.of')} 0`
  }

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  return `${start}-${end} ${translateMessage(getCurrentLanguage(), 'common.of')} ${total}`
}
