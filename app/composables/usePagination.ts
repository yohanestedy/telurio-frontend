import type { PaginatedMeta } from '../types/domain'

export function usePagination(initialLimit = 10) {
  const page = ref(1)
  const limit = ref(initialLimit)
  const total = ref(0)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

  function applyMeta(meta?: PaginatedMeta) {
    if (!meta) {
      return
    }

    total.value = meta.total
    page.value = meta.page
    limit.value = meta.limit
  }

  return {
    page,
    limit,
    total,
    totalPages,
    query: computed(() => ({
      page: page.value,
      limit: limit.value,
    })),
    applyMeta,
  }
}
