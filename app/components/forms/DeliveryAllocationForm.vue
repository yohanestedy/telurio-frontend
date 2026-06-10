<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { formatKg as formatKgValue } from '../../utils/formatters'

const { t } = useI18n()

const validationSchema = toTypedSchema(z.object({
  allocations: z.array(
    z.object({
      coopId: z.string().min(1),
      quantityKg: z.coerce.number().min(0.001),
    }),
  ).min(1, 'Minimal satu alokasi kandang harus diisi'),
  customPricePerKg: z.coerce.number().int().min(0).optional(),
}))

type FormValues = {
  allocations: Array<{ coopId: string; quantityKg: number }>
  customPricePerKg?: string
}

type SubmitValues = {
  allocations: Array<{ coopId: string; quantityKg: number }>
  customPricePerKg?: number
}

interface CoopStockItem {
  coopId: string
  availableKg: string
}

interface AllocationDraftItem {
  coopId: string
  quantityKg: number | string
}

const props = withDefaults(defineProps<{
  coopOptions: Array<{ label: string; value: string }>
  orderQuantityKg: string
  orderPricePerKg?: string | null
  todayPricePerKg?: string | null
  canSetPriceNow?: boolean
  enablePriceLock?: boolean
  submitLabel?: string
  initialAllocations?: AllocationDraftItem[]
  combinedAvailableKg?: string | null
  coopStocks?: CoopStockItem[]
  submitting?: boolean
}>(), {
  orderPricePerKg: null,
  todayPricePerKg: null,
  canSetPriceNow: false,
  enablePriceLock: true,
  submitLabel: 'Mulai Hantar',
  initialAllocations: () => [],
  combinedAvailableKg: null,
  coopStocks: () => [],
  submitting: false,
})

const emit = defineEmits<{
  submit: [{ allocations: Array<{ coopId: string; quantityKg: number }>; customPricePerKg?: number }]
  cancel: []
}>()

const { handleSubmit, setFieldValue } = useForm<FormValues, SubmitValues>({
  validationSchema,
  initialValues: {
    allocations: [],
    customPricePerKg: undefined,
  },
})

const values = ref<Record<string, string>>({})
const error = ref('')
const priceError = ref('')
const priceMode = ref<'today' | 'custom'>('today')
const customPricePerKg = ref('')

const total = computed(() =>
  Object.values(values.value).reduce((sum, item) => sum + (Number(item) || 0), 0),
)

const existingAllocationByCoop = computed(() => {
  const map = new Map<string, number>()

  for (const item of props.initialAllocations) {
    const normalized = Number(item.quantityKg)
    if (Number.isNaN(normalized)) {
      continue
    }

    const current = map.get(item.coopId) ?? 0
    map.set(item.coopId, Number((current + normalized).toFixed(3)))
  }

  return map
})

const existingAllocationTotal = computed(() =>
  [...existingAllocationByCoop.value.values()].reduce((sum, item) => sum + item, 0),
)

const stockByCoop = computed(() =>
  new Map(
    props.coopStocks.map((item) => [
      item.coopId,
      Number((Number(item.availableKg) + (existingAllocationByCoop.value.get(item.coopId) ?? 0)).toFixed(3)),
    ]),
  ),
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

const combinedAvailableForForm = computed(() => {
  if (props.combinedAvailableKg === null) {
    return null
  }

  return Number((Number(props.combinedAvailableKg) + existingAllocationTotal.value).toFixed(3))
})

const combinedOverKg = computed(() => {
  if (combinedAvailableForForm.value === null) {
    return 0
  }

  return Number((total.value - combinedAvailableForForm.value).toFixed(3))
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

const requiresPriceLock = computed(() =>
  props.enablePriceLock && orderPricePerKgValue.value === null,
)

const shouldShowPriceLockCard = computed(() =>
  props.enablePriceLock || orderPricePerKgValue.value !== null,
)

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

watch(
  () => [props.coopOptions, props.initialAllocations],
  () => {
    const nextValues: Record<string, string> = {}

    for (const coop of props.coopOptions) {
      const initial = existingAllocationByCoop.value.get(coop.value)
      nextValues[coop.value] = initial !== undefined ? String(initial) : ''
    }

    values.value = nextValues
    error.value = ''
  },
  { immediate: true },
)

function formatKg(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '0'
  }

  const formatted = formatKgValue(value)
  return formatted === '-' ? '0' : formatted
}

const submitValidated = handleSubmit((formValues) => {
  emit('submit', {
    allocations: formValues.allocations,
    ...(formValues.customPricePerKg !== undefined
      ? { customPricePerKg: formValues.customPricePerKg }
      : {}),
  })
})

function onSubmit() {
  error.value = ''
  priceError.value = ''
  const allocations = Object.entries(values.value)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([coopId, qty]) => ({ coopId, quantityKg: Number(qty) }))

  if (allocations.length === 0) {
    error.value = t('validation.allocation.minOne')
    return
  }

  if (Number(total.value.toFixed(3)) !== Number(Number(props.orderQuantityKg).toFixed(3))) {
    error.value = t('validation.allocation.totalMismatch')
    return
  }

  if (overByCoop.value.size > 0) {
    error.value = t('validation.allocation.exceedsStock')
    return
  }

  if (combinedOverKg.value > 0) {
    error.value = `${t('stock.combinedShortage')} ${formatKg(combinedOverKg.value)} kg`
    return
  }

  let customPricePayload: string | undefined
  if (requiresPriceLock.value) {
    if (!props.canSetPriceNow) {
      priceError.value = t('order.priceForm.notToday')
      return
    }

    if (todayPricePerKgValue.value === null) {
      priceError.value = t('order.priceForm.todayUnavailable')
      return
    }

    if (priceMode.value === 'custom') {
      if (!customPricePerKg.value) {
        priceError.value = t('order.priceForm.customRequired')
        return
      }

      const parsedCustom = Number(customPricePerKg.value)
      if (Number.isNaN(parsedCustom) || !Number.isFinite(parsedCustom) || !Number.isInteger(parsedCustom) || parsedCustom < 0) {
        priceError.value = t('order.priceForm.customInvalid')
        return
      }

      customPricePayload = customPricePerKg.value
    }
  }

  setFieldValue('allocations', allocations)
  setFieldValue('customPricePerKg', customPricePayload)
  submitValidated()
}

function preventNumberScroll(event: WheelEvent) {
  if (event.cancelable) {
    event.preventDefault()
  }

  const target = event.target as HTMLInputElement
  if (document.activeElement === target) {
    target.blur()
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-2xl border border-white/50 bg-white/65 p-4 text-sm text-ink-700">
      {{ t('order.total') }}: <span class="font-semibold">{{ formatKg(orderQuantityKg) }} kg</span>
      <span class="mx-2">•</span>
      {{ t('order.Allocations') }}: <span class="font-semibold">{{ formatKg(total) }} kg</span>
      <span class="mx-2">•</span>
      {{ t('stock.combinedAvailable') }}: <span class="font-semibold">{{ formatKg(combinedAvailableForForm) }} kg</span>
    </div>

    <div
      v-if="shouldShowPriceLockCard"
      class="space-y-3 rounded-2xl border border-brand-200/70 bg-brand-50/40 px-4 py-4"
    >
      <p class="text-sm font-semibold text-ink-900">{{ t('order.priceForm.title') }}</p>

      <template v-if="!requiresPriceLock">
        <p class="text-xs text-ink-600">
          {{ t('order.priceForm.standardLabel') }}: <span class="font-semibold text-ink-900">{{ formatRupiah(orderPricePerKgValue) }}/kg</span>
        </p>
      </template>

      <template v-else>
        <p v-if="hasPriceBlockingCondition" class="text-xs text-rose-700">
          {{ !canSetPriceNow
            ? t('order.priceForm.notToday')
            : t('order.priceForm.todayUnavailable') }}
        </p>

        <template v-else>
          <p class="text-xs text-ink-600">
            {{ t('order.priceForm.standardLabel') }}: <span class="font-semibold text-ink-900">{{ formatRupiah(todayPricePerKgValue) }}/kg</span>
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
              {{ t('order.priceForm.useStandard') }}
            </button>
            <button
              type="button"
              class="rounded-2xl border px-3 py-2 text-left text-sm transition"
              :class="priceMode === 'custom'
                ? 'border-brand-300 bg-white text-ink-900 shadow-[0_6px_20px_rgba(37,99,235,0.12)]'
                : 'border-white/70 bg-white/70 text-ink-700 hover:bg-white'"
              @click="priceMode = 'custom'"
            >
              {{ t('order.priceForm.useCustom') }}
            </button>
          </div>

          <UiInput
            v-if="priceMode === 'custom'"
            v-model="customPricePerKg"
            :label="t('order.priceForm.customLabel')"
            thousand-separator
            prefix="Rp"
            placeholder="25000"
          />
        </template>
      </template>

      <p class="text-xs text-ink-600">
        {{ t('order.priceForm.previewTotal') }}:
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
            {{ t('stock.available') }}: {{ formatKg(stockByCoop.get(coop.value) ?? 0) }} kg
          </p>
          <p
            v-if="overByCoop.has(coop.value)"
            class="mt-1 text-xs font-medium text-rose-600"
          >
            {{ t('stock.exceeds') }} {{ formatKg(overByCoop.get(coop.value) ?? 0) }} kg
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
            @wheel="preventNumberScroll"
          >
        </div>
      </label>
    </div>
    <p v-if="combinedOverKg > 0" class="text-sm font-medium text-rose-600">
      {{ t('stock.combinedShortage') }} {{ formatKg(combinedOverKg) }} kg
    </p>
    <p v-if="error" class="text-sm font-medium text-rose-600">{{ error }}</p>
    <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" :disabled="submitting" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton icon="delivery" :disabled="submitting || hasStockShortage || hasPriceBlockingCondition" block class="sm:w-auto" @click="onSubmit">
        {{ submitting ? t('common.saving') : submitLabel }}
      </UiButton>
    </div>
  </div>
</template>
