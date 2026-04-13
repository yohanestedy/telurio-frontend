import type { PriceItem } from '../types/domain'
import { ApiClientError } from '../types/api'

export function useTodayPriceStatus() {
  const api = useApi()

  const currentPrice = ref<PriceItem | null>(null)
  const todayPriceMissing = ref(false)

  async function loadTodayPriceStatus() {
    todayPriceMissing.value = false

    try {
      currentPrice.value = await api.get<PriceItem>('/prices/current')
    } catch (caught) {
      const mapped = caught instanceof ApiClientError ? caught : api.mapError(caught)

      if (mapped.status === 404) {
        currentPrice.value = null
        todayPriceMissing.value = true
        return
      }

      throw mapped
    }
  }

  return {
    currentPrice,
    todayPriceMissing,
    loadTodayPriceStatus,
  }
}
