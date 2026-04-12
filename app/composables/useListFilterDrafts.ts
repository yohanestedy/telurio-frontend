import { reactive, watch, type Ref, type WritableComputedRef } from 'vue'

type StringFilterRef = Ref<string> | WritableComputedRef<string>
type FilterRefMap = Record<string, StringFilterRef>
type DraftValues<T extends FilterRefMap> = { [K in keyof T]: string }

export function useListFilterDrafts<T extends FilterRefMap>(
  activeFilters: T,
  options?: {
    apply?: (draftValues: DraftValues<T>, activeFilters: T) => void
    reset?: (activeFilters: T) => void
  },
) {
  const keys = Object.keys(activeFilters) as Array<keyof T>

  const draftFilters = reactive(
    Object.fromEntries(keys.map((key) => [key, activeFilters[key].value ?? ''])) as DraftValues<T>,
  )

  function syncFromActive() {
    keys.forEach((key) => {
      draftFilters[key] = activeFilters[key].value ?? ''
    })
  }

  function applyDrafts() {
    if (options?.apply) {
      options.apply({ ...draftFilters }, activeFilters)
      return
    }

    keys.forEach((key) => {
      activeFilters[key].value = draftFilters[key]
    })
  }

  function resetActive() {
    if (options?.reset) {
      options.reset(activeFilters)
    } else {
      keys.forEach((key) => {
        activeFilters[key].value = ''
      })
    }
    syncFromActive()
  }

  watch(
    () => keys.map((key) => activeFilters[key].value),
    () => {
      syncFromActive()
    },
    { immediate: true },
  )

  return {
    draftFilters,
    applyDrafts,
    resetActive,
    syncFromActive,
  }
}
