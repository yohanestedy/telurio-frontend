import type { PaginatedMeta } from '../types/domain'

export function usePagination(initialLimit = 10) {
  const page = ref(1)
  const limit = ref(initialLimit)
  const total = ref(0)
  const sortBy = ref('createdAt')
  const order = ref<'asc' | 'desc'>('desc')
  const filters = ref<Record<string, unknown>>({})
  const serverTotalPages = ref(1)
  const serverHasNextPage = ref(false)
  const serverHasPrevPage = ref(false)

  const totalPages = computed(() =>
    Math.max(serverTotalPages.value, Math.ceil(total.value / limit.value) || 1),
  )

  const hasNextPage = computed(() =>
    serverHasNextPage.value || page.value < totalPages.value,
  )

  const hasPrevPage = computed(() =>
    serverHasPrevPage.value || page.value > 1,
  )

  function applyMeta(meta?: PaginatedMeta) {
    if (!meta) {
      return
    }

    total.value = meta.total
    page.value = Math.max(1, meta.page)
    limit.value = Math.max(1, meta.limit)
    serverTotalPages.value = Math.max(1, meta.totalPages)
    serverHasNextPage.value = meta.hasNextPage
    serverHasPrevPage.value = meta.hasPrevPage
    sortBy.value = meta.sortBy
    order.value = meta.order
    filters.value = meta.filters
  }

  function setPage(nextPage: number) {
    page.value = Math.min(Math.max(1, nextPage), totalPages.value)
  }

  function nextPage() {
    setPage(page.value + 1)
  }

  function prevPage() {
    setPage(page.value - 1)
  }

  function setLimit(nextLimit: number) {
    limit.value = Math.max(1, nextLimit)
    page.value = 1
  }

  function resetPage() {
    page.value = 1
  }

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    sortBy,
    order,
    filters,
    query: computed(() => ({
      page: page.value,
      limit: limit.value,
    })),
    applyMeta,
    setPage,
    nextPage,
    prevPage,
    setLimit,
    resetPage,
  }
}
