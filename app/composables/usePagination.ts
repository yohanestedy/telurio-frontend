import type { PaginatedMeta } from "../types/domain";

export function usePagination(initialLimit = 10) {
  const page = ref(1);
  const limit = ref(initialLimit);
  const all = ref(false);
  const total = ref(0);
  const sortBy = ref("createdAt");
  const order = ref<"asc" | "desc">("desc");
  const filters = ref<Record<string, unknown>>({});
  const serverTotalPages = ref(1);
  const serverHasNextPage = ref(false);
  const serverHasPrevPage = ref(false);

  const totalPages = computed(() =>
    Math.max(serverTotalPages.value, Math.ceil(total.value / limit.value) || 1),
  );

  const hasNextPage = computed(
    () => serverHasNextPage.value || page.value < totalPages.value,
  );

  const hasPrevPage = computed(() => serverHasPrevPage.value || page.value > 1);

  function applyMeta(meta?: PaginatedMeta) {
    if (!meta) {
      return;
    }

    const allFromMeta = Boolean(meta.filters?.all);

    all.value = allFromMeta;
    total.value = meta.total;
    page.value = Math.max(1, meta.page);
    if (!allFromMeta) {
      limit.value = Math.max(1, meta.limit);
    }
    serverTotalPages.value = Math.max(1, meta.totalPages);
    serverHasNextPage.value = meta.hasNextPage;
    serverHasPrevPage.value = meta.hasPrevPage;
    sortBy.value = meta.sortBy;
    order.value = meta.order;
    filters.value = meta.filters;
  }

  function setPage(nextPage: number) {
    page.value = Math.min(Math.max(1, nextPage), totalPages.value);
  }

  function nextPage() {
    setPage(page.value + 1);
  }

  function prevPage() {
    setPage(page.value - 1);
  }

  function setLimit(nextLimit: number) {
    limit.value = Math.max(1, nextLimit);
    all.value = false;
    page.value = 1;
  }

  function setAll(nextAll: boolean) {
    all.value = nextAll;
    page.value = 1;
  }

  function resetPage() {
    page.value = 1;
  }

  return {
    page,
    limit,
    all,
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
      all: all.value ? true : undefined,
    })),
    applyMeta,
    setPage,
    nextPage,
    prevPage,
    setLimit,
    setAll,
    resetPage,
  };
}
