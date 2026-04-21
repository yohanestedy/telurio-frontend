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
  combinedAvailableKg?: string | null
  coopStocks?: CoopStockItem[]
  submitting?: boolean
}>(), {
  combinedAvailableKg: null,
  coopStocks: () => [],
  submitting: false,
})

const emit = defineEmits<{
  submit: [{ allocations: Array<{ coopId: string; quantityKg: number }> }]
}>()

const values = ref<Record<string, string>>({})
const error = ref('')

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

function formatKg(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '0'
  }

  const formatted = formatKgValue(value)
  return formatted === '-' ? '0' : formatted
}

function onSubmit() {
  error.value = ''
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

  emit('submit', {
    allocations: parsed.data,
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
      <UiButton :disabled="submitting || hasStockShortage" @click="onSubmit">
        {{ submitting ? 'Menyimpan...' : 'Mulai pengantaran' }}
      </UiButton>
    </div>
  </div>
</template>
