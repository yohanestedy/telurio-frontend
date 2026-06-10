<script setup lang="ts">
const { t } = useI18n()

const props = withDefaults(defineProps<{
  orderQuantityKg: string
  standardPricePerKg: string | null
  submitting?: boolean
}>(), {
  submitting: false,
})

const emit = defineEmits<{
  submit: [{ customPricePerKg?: number }]
  cancel: []
}>()

const priceMode = ref<'standard' | 'custom'>('standard')
const customPricePerKg = ref('')
const priceError = ref('')

const orderQuantityKgValue = computed(() => {
  const normalized = Number(props.orderQuantityKg)
  return Number.isNaN(normalized) ? 0 : normalized
})

const standardPriceValue = computed(() => {
  if (props.standardPricePerKg === null || props.standardPricePerKg === '') {
    return null
  }

  const normalized = Number(props.standardPricePerKg)
  return Number.isNaN(normalized) ? null : normalized
})

const effectivePricePerKg = computed(() => {
  if (priceMode.value === 'standard') {
    return standardPriceValue.value
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

watch(priceMode, () => {
  priceError.value = ''
})

watch(customPricePerKg, () => {
  priceError.value = ''
})

function onSubmit() {
  priceError.value = ''

  if (priceMode.value === 'standard') {
    if (standardPriceValue.value === null) {
      priceError.value = t('order.priceForm.standardMissing')
      return
    }

    emit('submit', {})
    return
  }

  if (!customPricePerKg.value) {
    priceError.value = t('order.priceForm.customRequired')
    return
  }

  const parsedCustom = Number(customPricePerKg.value)
  if (
    Number.isNaN(parsedCustom)
    || !Number.isFinite(parsedCustom)
    || !Number.isInteger(parsedCustom)
    || parsedCustom < 5000
  ) {
    priceError.value = t('order.priceForm.customInvalid')
    return
  }

  emit('submit', { customPricePerKg: parsedCustom })
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
      {{ t('order.quantity') }}:
      <span class="font-semibold">{{ formatKg(orderQuantityKg) }} kg</span>
    </div>

    <div class="space-y-3 rounded-2xl border border-brand-200/70 bg-brand-50/40 px-4 py-4">
      <p class="text-sm font-semibold text-ink-900">{{ t('order.priceForm.title') }}</p>

      <p class="text-xs text-ink-600">
        {{ t('order.priceForm.standardLabel') }}:
        <span class="font-semibold text-ink-900">{{ formatRupiah(standardPriceValue) }}/kg</span>
      </p>

      <div class="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          class="rounded-2xl border px-3 py-2 text-left text-sm transition"
          :class="priceMode === 'standard'
            ? 'border-brand-300 bg-white text-ink-900 shadow-[0_6px_20px_rgba(37,99,235,0.12)]'
            : 'border-white/70 bg-white/70 text-ink-700 hover:bg-white'"
          @click="priceMode = 'standard'"
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
        placeholder="25.000"
        @wheel="preventNumberScroll"
      />

      <p class="text-xs text-ink-600">
        {{ t('order.priceForm.previewTotal') }}:
        <span class="font-semibold text-ink-900">{{ previewTotalInvoice === null ? '-' : formatRupiah(previewTotalInvoice) }}</span>
      </p>

      <p v-if="priceError" class="text-xs font-medium text-rose-600">{{ priceError }}</p>
    </div>

    <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" :disabled="submitting" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton icon="key" :disabled="submitting" block class="sm:w-auto" @click="onSubmit">
        {{ submitting ? t('common.saving') : t('order.action.lockPrice') }}
      </UiButton>
    </div>
  </div>
</template>
