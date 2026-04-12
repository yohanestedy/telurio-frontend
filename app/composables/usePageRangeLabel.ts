import { computed } from 'vue'
import { getPageRangeLabel } from '../utils/list'

export function usePageRangeLabel(pagination: ReturnType<typeof usePagination>) {
  return computed(() =>
    getPageRangeLabel(
      pagination.page.value,
      pagination.limit.value,
      pagination.total.value,
    ),
  )
}
