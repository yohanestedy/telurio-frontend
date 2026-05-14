import type { Ref } from "vue";

interface UseListPageActionsOptions {
  loading: Ref<boolean>;
  sortBy: Ref<string>;
  sortOrder: Ref<"asc" | "desc">;
  resetPage: () => void;
  setPage: (nextPage: number) => void;
  setLimit: (nextLimit: number) => void;
  load: () => Promise<void>;
  applyDrafts: () => void;
  resetActive: () => void;
}

export function useListPageActions(options: UseListPageActionsOptions) {
  const resetFilters = async () => {
    options.resetActive();
    options.resetPage();
    await options.load();
  };

  const applyFilters = async () => {
    options.applyDrafts();
    options.resetPage();
    await options.load();
  };

  const onPageChange = async (nextPage: number) => {
    options.setPage(nextPage);
    await options.load();
  };

  const onLimitChange = async (nextLimit: number) => {
    options.setLimit(nextLimit);
    await options.load();
  };

  watch([options.sortBy, options.sortOrder], () => {
    options.resetPage();
    if (!options.loading.value) {
      options.load();
    }
  });

  return {
    resetFilters,
    applyFilters,
    onPageChange,
    onLimitChange,
  };
}
