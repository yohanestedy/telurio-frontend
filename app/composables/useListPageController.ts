import type { Ref, WritableComputedRef } from "vue";
import { useListFilterDrafts } from "./useListFilterDrafts";
import { useListPageActions } from "./useListPageActions";

type StringFilterRef = Ref<string> | WritableComputedRef<string>;
type FilterRefMap = Record<string, StringFilterRef>;

interface UseListPageControllerOptions<T extends FilterRefMap> {
  filters: T;
  loading: Ref<boolean>;
  sortBy: Ref<string>;
  sortOrder: Ref<"asc" | "desc">;
  resetPage: () => void;
  setPage: (nextPage: number) => void;
  setLimit: (nextLimit: number) => void;
  load: () => Promise<void>;
  draftOptions?: {
    apply?: (draftValues: { [K in keyof T]: string }, activeFilters: T) => void;
    reset?: (activeFilters: T) => void;
  };
}

export function useListPageController<T extends FilterRefMap>(
  options: UseListPageControllerOptions<T>,
) {
  const { draftFilters, applyDrafts, resetActive, syncFromActive } =
    useListFilterDrafts(options.filters, options.draftOptions);

  const actions = useListPageActions({
    loading: options.loading,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
    resetPage: options.resetPage,
    setPage: options.setPage,
    setLimit: options.setLimit,
    load: options.load,
    applyDrafts,
    resetActive,
  });

  return {
    draftFilters,
    applyDrafts,
    resetActive,
    syncFromActive,
    ...actions,
  };
}
