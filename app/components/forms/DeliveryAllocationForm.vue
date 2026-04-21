<script setup lang="ts">
import { z } from 'zod'
import { formatKg as formatKgValue } from '../../utils/formatters'

const allocationSchema = z.array(
  z.object({
    coopId: z.string().min(1),
    quantityKg: z.coerce.number().min(0.001),
  }),
)

interface CoopStockItem {
  coopId: string
  availableKg: string
}

const props = withDefaults(defineProps<{
  coopOptions: Array<{ label: string; value: string }>
  orderQuantityKg: string
  orderPricePerKg?: string | null
  todayPricePerKg?: string | null
  canSetPriceNow?: boolean
  combinedAvailableKg?: string | null
  coopStocks?: CoopStockItem[]
  submitting?: boolean
}>(), {
  orderPricePerKg: null,
  todayPricePerKg: null,
  canSetPriceNow: false,
  combinedAvailableKg: null,
  coopStocks: () => [],
  submitting: false,
})

const emit = defineEmits<{
  submit: [{ allocations: Array<{ coopId: string; quantityKg: number }>; customPricePerKg?: number }]
}>()

const values = ref<Record<string, string>>({})
const error = ref('')
const priceError = ref('')
const priceMode = ref<'today' | 'custom'>('today')
const customPricePerKg = ref('')

const total = computed(() =>
  Object.values(values.value).reduce((sum, item) => sum + (Number(item) || 0), 0),
)

const stockByCoop = computed(() =>
  new Map(props.coopStocks.map((item) => [item.coopId, Number(item.availableKg)])),
)

const overByCoop = computed(() => {
  const result = new Map<string, number>()

  for (const [coopId, qty] of Object.entries(values.value)) {
    const enteredKg = Number(qty) || 0
    const availableKg = stockByCoop.value.get(coopId) ?? 0
    const overKg = Number((enteredKg - availableKg).toFixed(3))
    if (overKg > 0) {
      result.set(coopId, overKg)
    }
  }

  return result
})

const combinedOverKg = computed(() => {
  if (props.combinedAvailableKg === null) {
    return 0
  }

  const available = Number(props.combinedAvailableKg)
  return Number((total.value - available).toFixed(3))
})

const hasStockShortage = computed(() =>
  overByCoop.value.size > 0 || combinedOverKg.value > 0,
)

const orderQuantityKgValue = computed(() => {
  const normalized = Number(props.orderQuantityKg)
  return Number.isNaN(normalized) ? 0 : normalized
})

const orderPricePerKgValue = computed(() => {
  if (props.orderPricePerKg === null || props.orderPricePerKg === undefined || props.orderPricePerKg === '') {
    return null
  }

  const normalized = Number(props.orderPricePerKg)
  return Number.isNaN(normalized) ? null : normalized
})

const todayPricePerKgValue = computed(() => {
  if (props.todayPricePerKg === null || props.todayPricePerKg === undefined || props.todayPricePerKg === '') {
    return null
  }

  const normalized = Number(props.todayPricePerKg)
  return Number.isNaN(normalized) ? null : normalized
})

const requiresPriceLock = computed(() => orderPricePerKgValue.value === null)

const effectivePricePerKg = computed(() => {
  if (!requiresPriceLock.value) {
    return orderPricePerKgValue.value
  }

  if (!props.canSetPriceNow || todayPricePerKgValue.value === null) {
    return null
  }

  if (priceMode.value === 'today') {
    return todayPricePerKgValue.value
  }

  const normalized = Number(customPricePerKg.value)
  return Number.isNaN(normalized) ? null : normalized
})

const previewTotalInvoice = computed(() => {
  if (effectivePricePerKg.value === null) {
    return null
  }

  return Math.round(orderQuantityKgValue.value * effectivePricePerKg.value)
})

const hasPriceBlockingCondition = computed(() => {
  if (!requiresPriceLock.value) {
    return false
  }

  if (!props.canSetPriceNow) {
    return true
  }

  return todayPricePerKgValue.value === null
})

watch(
  () => [props.orderPricePerKg, props.todayPricePerKg, props.canSetPriceNow],
  () => {
    priceMode.value = 'today'
    customPricePerKg.value = ''
    priceError.value = ''
  },
)

watch(priceMode, () => {
  priceError.value = ''
})

watch(customPricePerKg, () => {
  priceError.value = ''
})

function formatKg(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '0'
  }

  const formatted = formatKgValue(value)
  return formatted === '-' ? '0' : formatted
}

function onSubmit() {
  error.value = ''
  priceError.value = ''
  const allocations = Object.entries(values.value)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([coopId, qty]) => ({ coopId, quantityKg: Number(qty) }))

  const parsed = allocationSchema.safeParse(allocations)
  if (!parsed.success) {
    error.value = 'Minimal satu alokasi kandang harus diisi'
    return
  }

  if (Number(total.value.toFixed(3)) !== Number(Number(props.orderQuantityKg).toFixed(3))) {
    error.value = 'Total alokasi harus sama dengan kuantitas order'
    return
  }

  if (overByCoop.value.size > 0) {
    error.value = 'Satu atau lebih alokasi kandang melebihi stok live kandang'
    return
  }

  if (combinedOverKg.value > 0) {
    error.value = `Stok gabungan tidak cukup. Kekurangan ${formatKg(combinedOverKg.value)} kg`
    return
  }

  let customPricePayload: number | undefined
  if (requiresPriceLock.value) {
    if (!props.canSetPriceNow) {
      priceError.value = 'Harga order belum bisa dikunci karena tanggal kirim bukan hari ini'
      return
    }

    if (todayPricePerKgValue.value === null) {
      priceError.value = 'Harga harian hari ini belum tersedia. Hubungi admin untuk input harga hari ini.'
      return
    }

    if (priceMode.value === 'custom') {
      if (!customPricePerKg.value) {
        priceError.value = 'Harga custom wajib diisi'
        return
      }

      const parsedCustom = Number(customPricePerKg.value)
      if (Number.isNaN(parsedCustom) || !Number.isFinite(parsedCustom) || !Number.isInteger(parsedCustom) || parsedCustom < 0) {
        priceError.value = 'Harga custom harus angka bulat minimal 0'
        return
      }

      customPricePayload = parsedCustom
    }
  }

  emit('submit', {
    allocations: parsed.data,
    ...(customPricePayload !== undefined
      ? { customPricePerKg: customPricePayload }
      : {}),
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-2xl border border-white/50 bg-white/65 p-4 text-sm text-ink-700">
      Total order: <span class="font-semibold">{{ formatKg(orderQuantityKg) }} kg</span>
      <span class="mx-2">•</span>
      Total alokasi: <span class="font-semibold">{{ formatKg(total) }} kg</span>
      <span class="mx-2">•</span>
      Stok gabungan tersedia: <span class="font-semibold">{{ formatKg(combinedAvailableKg) }} kg</span>
    </div>

    <div class="space-y-3 rounded-2xl border border-brand-200/70 bg-brand-50/40 px-4 py-4">
      <p class="text-sm font-semibold text-ink-900">Lock harga order</p>

      <template v-if="!requiresPriceLock">
        <p class="text-xs text-ink-600">
          Harga order sudah terkunci: <span class="font-semibold text-ink-900">{{ formatRupiah(orderPricePerKgValue) }}/kg</span>
        </p>
      </template>

      <template v-else>
        <p v-if="hasPriceBlockingCondition" class="text-xs text-rose-700">
          {{ !canSetPriceNow
            ? 'Tanggal kirim bukan hari ini, sehingga harga belum bisa dikunci.'
            : 'Harga harian hari ini belum tersedia.' }}
        </p>

        <template v-else>
          <p class="text-xs text-ink-600">
            Harga standar hari ini: <span class="font-semibold text-ink-900">{{ formatRupiah(todayPricePerKgValue) }}/kg</span>
          </p>

          <div class="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="rounded-2xl border px-3 py-2 text-left text-sm transition"
              :class="priceMode === 'today'
                ? 'border-brand-300 bg-white text-ink-900 shadow-[0_6px_20px_rgba(37,99,235,0.12)]'
                : 'border-white/70 bg-white/70 text-ink-700 hover:bg-white'"
              @click="priceMode = 'today'"
            >
              Gunakan harga hari ini
            </button>
            <button
              type="button"
              class="rounded-2xl border px-3 py-2 text-left text-sm transition"
              :class="priceMode === 'custom'
                ? 'border-brand-300 bg-white text-ink-900 shadow-[0_6px_20px_rgba(37,99,235,0.12)]'
                : 'border-white/70 bg-white/70 text-ink-700 hover:bg-white'"
              @click="priceMode = 'custom'"
            >
              Gunakan harga custom
            </button>
          </div>

          <UiInput
            v-if="priceMode === 'custom'"
            v-model="customPricePerKg"
            label="Harga custom per kg"
            type="number"
            min="0"
            step="1"
            placeholder="25000"
          />
        </template>
      </template>

      <p class="text-xs text-ink-600">
        Preview total invoice:
        <span class="font-semibold text-ink-900">{{ previewTotalInvoice === null ? '-' : formatRupiah(previewTotalInvoice) }}</span>
      </p>

      <p v-if="priceError" class="text-xs font-medium text-rose-600">{{ priceError }}</p>
    </div>

    <div class="grid gap-3">
      <label
        v-for="coop in coopOptions"
        :key="coop.value"
        class="flex items-center justify-between gap-4 rounded-2xl border border-white/40 bg-white/70 p-4"
      >
        <div>
          <p class="text-sm font-medium text-ink-800">{{ coop.label }}</p>
          <p class="text-xs text-ink-600">
            Stok tersedia: {{ formatKg(stockByCoop.get(coop.value) ?? 0) }} kg
          </p>
          <p
            v-if="overByCoop.has(coop.value)"
            class="mt-1 text-xs font-medium text-rose-600"
          >
            Melebihi stok {{ formatKg(overByCoop.get(coop.value) ?? 0) }} kg
          </p>
        </div>
        <div class="space-y-1 text-right">
          <input
            v-model="values[coop.value]"
            type="number"
            step="0.001"
            min="0"
            class="field-shell max-w-[160px]"
            placeholder="0.00"
          >
        </div>
      </label>
    </div>
    <p v-if="combinedOverKg > 0" class="text-sm font-medium text-rose-600">
      Stok gabungan kurang {{ formatKg(combinedOverKg) }} kg
    </p>
    <p v-if="error" class="text-sm font-medium text-rose-600">{{ error }}</p>
    <div class="flex justify-end">
      <UiButton :disabled="submitting || hasStockShortage || hasPriceBlockingCondition" @click="onSubmit">
        {{ submitting ? 'Menyimpan...' : 'Mulai pengantaran' }}
      </UiButton>
    </div>
  </div>
</template>
