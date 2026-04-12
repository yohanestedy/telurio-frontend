import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { SortFieldOption, SortOptionKind } from '../utils/list'
import { getSortOrderOptions } from '../utils/list'

export function useListSort(
  sortBy: MaybeRefOrGetter<string>,
  options: MaybeRefOrGetter<readonly SortFieldOption[]>,
) {
  const selectedSortKind = computed<SortOptionKind>(() => {
    const currentSortBy = toValue(sortBy)
    const currentOptions = toValue(options)
    const option = currentOptions.find((item) => item.value === currentSortBy)
    return option?.kind ?? 'text'
  })

  const sortOrderOptions = computed(() => getSortOrderOptions(selectedSortKind.value))

  return {
    selectedSortKind,
    sortOrderOptions,
  }
}
