<script setup lang="ts">
import dayjs from 'dayjs'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { paymentMethods, paymentStatuses } from '../../types/domain'
import type { AppIconName } from '../../utils/icons'

const { t } = useI18n()
import { formatKg as formatKgValue } from '../../utils/formatters'

const createSchema = z
  .object({
    customerId: z.string().min(1, t('validation.required.customer')),
    quantityKg: z.coerce.number().min(0.1, t('validation.min.positive')),
    deliveryDate: z.string().min(1, t('validation.required.date')),
    deliverBefore: z.string().optional(),
    paymentStatus: z.enum(paymentStatuses),
    paymentMethod: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.enum(paymentMethods).optional(),
    ),
    dpAmount: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.coerce.number().min(1000, t('validation.min.dpAmount')).optional(),
    ),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const deliveryDate = dayjs(value.deliveryDate).startOf('day')
    if (deliveryDate.isValid() && deliveryDate.isAfter(dayjs().startOf('day')) && value.paymentStatus === 'LUNAS') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentStatus'],
        message: t('validation.payment.lunasFuture'),
      })
    }

    if (value.paymentStatus === 'DP') {
      if (!value.paymentMethod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['paymentMethod'],
          message: t('validation.payment.methodRequiredForDp'),
        })
      }
      if (value.dpAmount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dpAmount'],
          message: t('validation.payment.dpRequired'),
        })
      }
    }

    if (value.paymentStatus === 'LUNAS' && !value.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentMethod'],
        message: t('validation.payment.methodRequiredForLunas'),
      })
    }
  })

const updateSchema = z.object({
  quantityKg: z.coerce.number().min(0.1, t('validation.min.positive')),
  deliveryDate: z.string().min(1, t('validation.required.date')),
  deliverBefore: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = {
  customerId: string
  quantityKg: string
  deliveryDate: string
  deliverBefore: string
  paymentStatus: string
  paymentMethod: string
  dpAmount: string
  notes: string
}

type SubmitValues = {
  customerId?: string
  quantityKg: number
  deliveryDate: string
  deliverBefore?: string
  paymentStatus?: (typeof paymentStatuses)[number]
  paymentMethod?: (typeof paymentMethods)[number]
  dpAmount?: number
  notes?: string
}

const props = withDefaults(defineProps<{
  customerOptions: Array<{ label: string; value: string }>
  initialValue?: Partial<FormValues>
  submitting?: boolean
  isEdit?: boolean
  combinedAvailableKg?: string | null
  todayPricePerKg?: string | null
}>(), {
  combinedAvailableKg: null,
  todayPricePerKg: null,
})

const emit = defineEmits<{
  submit: [Record<string, string | number | undefined>]
  cancel: []
}>()

const validationSchema = computed(() => toTypedSchema(props.isEdit ? updateSchema : createSchema))

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues, SubmitValues>({
  validationSchema,
  initialValues: {
    customerId: '',
    quantityKg: '',
    deliveryDate: '',
    deliverBefore: '',
    paymentStatus: 'BELUM_BAYAR',
    paymentMethod: '',
    dpAmount: '',
    notes: '',
  },
})

const [customerId] = defineField('customerId')
const [quantityKg] = defineField('quantityKg')
const [deliveryDate] = defineField('deliveryDate')
const [deliverBefore] = defineField('deliverBefore')
const [paymentStatus] = defineField('paymentStatus')
const [paymentMethod] = defineField('paymentMethod')
const [dpAmount] = defineField('dpAmount')
const [notes] = defineField('notes')
const priceMode = ref<'today' | 'custom'>('today')
const customPricePerKg = ref('')
const customPriceError = ref('')

const combinedAvailableKgValue = computed(() => {
  if (props.combinedAvailableKg === null || props.combinedAvailableKg === undefined || props.combinedAvailableKg === '') {
    return null
  }

  return Number(props.combinedAvailableKg)
})

const enteredQuantityKg = computed(() => {
  if (!quantityKg.value) {
    return 0
  }

  return Number(quantityKg.value) || 0
})

const stockShortageKg = computed(() => {
  if (combinedAvailableKgValue.value === null) {
    return 0
  }

  return Number((enteredQuantityKg.value - combinedAvailableKgValue.value).toFixed(3))
})

const showCombinedStockWarning = computed(() =>
  !props.isEdit && stockShortageKg.value > 0,
)

function formatKg(value: number | null) {
  return formatKgValue(value)
}

const isFutureDelivery = computed(() => {
  if (!deliveryDate.value) {
    return false
  }

  const pickedDate = dayjs(deliveryDate.value).startOf('day')
  if (!pickedDate.isValid()) {
    return false
  }

  return pickedDate.isAfter(dayjs().startOf('day'))
})

const isTodayDelivery = computed(() => {
  if (!deliveryDate.value) {
    return false
  }

  const pickedDate = dayjs(deliveryDate.value).startOf('day')
  if (!pickedDate.isValid()) {
    return false
  }

  return pickedDate.isSame(dayjs().startOf('day'))
})

const todayPricePerKgValue = computed(() => {
  if (props.todayPricePerKg === null || props.todayPricePerKg === undefined || props.todayPricePerKg === '') {
    return null
  }

  const normalized = Number(props.todayPricePerKg)
  return Number.isNaN(normalized) ? null : normalized
})

const effectivePricePerKg = computed(() => {
  if (!isTodayDelivery.value) {
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

  const qty = enteredQuantityKg.value
  if (qty <= 0) {
    return 0
  }

  return Math.round(qty * effectivePricePerKg.value)
})

const paymentStatusOptions = computed(() =>
  paymentStatuses
    .filter((status) => status !== 'LUNAS' || !isFutureDelivery.value)
    .map((status) => ({
      label: paymentStatusLabel(status),
      value: status,
    })),
)

const paymentStatusCards = computed<Array<{ value: (typeof paymentStatuses)[number]; label: string; icon: AppIconName }>>(() =>
  paymentStatusOptions.value.map((status) => ({
    value: status.value,
    label: status.label,
    icon: status.value === 'BELUM_BAYAR' ? 'clock' : status.value === 'DP' ? 'money' : 'wallet',
  })),
)

const shouldShowPaymentMethod = computed(() =>
  !props.isEdit && paymentStatus.value !== 'BELUM_BAYAR',
)

const shouldShowDpAmount = computed(() =>
  !props.isEdit && paymentStatus.value === 'DP',
)

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        customerId: value?.customerId ?? '',
        quantityKg: value?.quantityKg ?? '',
        deliveryDate: value?.deliveryDate ?? '',
        deliverBefore: value?.deliverBefore ?? '',
        paymentStatus: value?.paymentStatus ?? 'BELUM_BAYAR',
        paymentMethod: value?.paymentMethod ?? '',
        dpAmount: value?.dpAmount ?? '',
        notes: value?.notes ?? '',
      },
    })

    priceMode.value = 'today'
    customPricePerKg.value = ''
    customPriceError.value = ''
  },
  { immediate: true },
)

watch(deliveryDate, () => {
  customPriceError.value = ''

  if (isFutureDelivery.value && paymentStatus.value === 'LUNAS') {
    paymentStatus.value = 'BELUM_BAYAR'
  }

  if (!isTodayDelivery.value) {
    priceMode.value = 'today'
    customPricePerKg.value = ''
  }
})

watch(priceMode, () => {
  customPriceError.value = ''
})

watch(customPricePerKg, () => {
  customPriceError.value = ''
})

watch(paymentStatus, (value) => {
  if (value === 'BELUM_BAYAR') {
    paymentMethod.value = ''
    dpAmount.value = ''
  }

  if (value === 'LUNAS') {
    dpAmount.value = ''
  }
})

const onSubmit = handleSubmit((values) => {
  customPriceError.value = ''

  if (!props.isEdit && isTodayDelivery.value && todayPricePerKgValue.value === null) {
    customPriceError.value = t('order.priceForm.todayUnavailable')
    return
  }

  let customPricePayload: number | undefined
  if (!props.isEdit && isTodayDelivery.value && priceMode.value === 'custom') {
    if (!customPricePerKg.value) {
      customPriceError.value = t('order.priceForm.customRequired')
      return
    }

    const parsedCustom = Number(customPricePerKg.value)
    if (Number.isNaN(parsedCustom) || !Number.isFinite(parsedCustom) || !Number.isInteger(parsedCustom) || parsedCustom < 5000) {
      customPriceError.value = t('order.priceForm.customInvalid')
      return
    }

    customPricePayload = parsedCustom
  }

  emit('submit', props.isEdit
    ? {
        quantityKg: values.quantityKg,
        deliveryDate: values.deliveryDate,
        deliverBefore: values.deliverBefore || undefined,
        notes: values.notes || undefined,
      }
    : {
        customerId: values.customerId,
        quantityKg: values.quantityKg,
        deliveryDate: values.deliveryDate,
        deliverBefore: values.deliverBefore || undefined,
        paymentStatus: values.paymentStatus,
        ...(values.paymentStatus === 'BELUM_BAYAR'
          ? {}
          : { paymentMethod: values.paymentMethod || undefined }),
        ...(values.paymentStatus === 'DP'
          ? { dpAmount: values.dpAmount }
          : {}),
        ...(customPricePayload !== undefined
          ? { customPricePerKg: customPricePayload }
          : {}),
        notes: values.notes || undefined,
      })
})
</script>

<template>
  <form class="space-y-5" @submit.prevent="onSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <UiSelect
        v-if="!isEdit"
        v-model="customerId"
        :options="customerOptions"
        :label="t('common.customer')"
        :placeholder="t('common.customer')"
        required
        :error="errors.customerId"
      />
      <UiInput v-model="quantityKg" :label="t('order.quantity') + ' (kg)'" type="number" min="0.1" step="0.1" required :error="errors.quantityKg" placeholder="0.1" />
    </div>

    <div class="rounded-3xl border border-white/50 bg-white/55 p-4 sm:p-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <UiDatePicker
          v-model="deliveryDate"
          :label="t('order.deliveryDate')"
          :placeholder="t('order.pickDeliveryDate')"
          required
          :error="errors.deliveryDate"
        />
        <UiTimePicker
          v-model="deliverBefore"
          :label="t('order.deliverBefore')"
          placeholder="--:--"
          :help="t('expense.optional')"
          :error="errors.deliverBefore"
        />
      </div>
    </div>

    <div
      v-if="showCombinedStockWarning"
      class="rounded-2xl border border-amber-300 bg-amber-50/80 px-4 py-3 text-sm text-amber-800"
    >
      {{ t('order.stockWarning') }}
      {{ t('stock.combinedAvailable') }} {{ formatKg(combinedAvailableKgValue) }} kg,
      {{ t('order.quantity') }} {{ formatKg(enteredQuantityKg) }} kg
      ({{ t('stock.combinedShortage') }} {{ formatKg(stockShortageKg) }} kg).
    </div>

    <div
      v-if="!isEdit && isTodayDelivery"
      class="space-y-3 rounded-2xl border border-brand-200/70 bg-brand-50/40 px-4 py-4"
    >
      <p class="text-sm font-semibold text-ink-900">{{ t('order.priceForm.title') }}</p>
      <p v-if="todayPricePerKgValue !== null" class="text-xs text-ink-600">
        {{ t('order.priceForm.standardLabel') }}: <span class="font-semibold text-ink-900">{{ formatRupiah(todayPricePerKgValue) }}/kg</span>
      </p>
      <p v-else class="text-xs text-rose-700">
        {{ t('order.priceForm.todayUnavailable') }}
      </p>

      <div v-if="todayPricePerKgValue !== null" class="grid gap-3 sm:grid-cols-2">
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
        v-if="todayPricePerKgValue !== null && priceMode === 'custom'"
        v-model="customPricePerKg"
        :label="t('order.priceForm.customLabel')"
        thousand-separator
        prefix="Rp"
        placeholder="25.000"
        :error="customPriceError"
      />

      <p v-if="todayPricePerKgValue !== null" class="text-xs text-ink-600">
        {{ t('order.priceForm.previewTotal') }}:
        <span class="font-semibold text-ink-900">{{ previewTotalInvoice === null ? '-' : formatRupiah(previewTotalInvoice) }}</span>
      </p>

      <p
        v-if="customPriceError && !(todayPricePerKgValue !== null && priceMode === 'custom')"
        data-field-error="true"
        class="text-xs font-medium text-rose-600"
      >
        {{ customPriceError }}
      </p>
    </div>

    <div v-if="!isEdit" class="space-y-3">
      <p class="text-sm font-semibold text-ink-800">{{ t('form.payment.statusLabel') }}</p>
      <div class="grid gap-3 sm:grid-cols-3">
        <button
          v-for="option in paymentStatusCards"
          :key="option.value"
          type="button"
          class="rounded-2xl border px-4 py-3 text-left transition"
          :class="paymentStatus === option.value
            ? 'border-amber-400 bg-amber-50 shadow-[0_8px_20px_rgba(251,191,36,0.22)]'
            : 'border-white/60 bg-white/60 hover:bg-white/85'"
          @click="paymentStatus = option.value"
        >
          <div class="flex items-center gap-2">
            <UiIcon :name="option.icon" class="h-4 w-4 text-ink-600" />
            <p class="text-sm font-semibold text-ink-900">{{ option.label }}</p>
          </div>
        </button>
      </div>
      <p v-if="isFutureDelivery" class="text-xs text-amber-700">
        {{ t('validation.payment.lunasFutureHint') }}
      </p>
      <p v-if="errors.paymentStatus" class="text-xs font-medium text-rose-600">
        {{ errors.paymentStatus }}
      </p>
    </div>

    <div
      v-if="shouldShowPaymentMethod"
      class="grid gap-4 sm:grid-cols-2"
    >
      <UiInput
        v-if="shouldShowDpAmount"
        v-model="dpAmount"
        :label="t('form.payment.dpAmount')"
        thousand-separator
        prefix="Rp"
        placeholder="500.000"
        :error="errors.dpAmount"
      />
      <UiSelect
        v-model="paymentMethod"
        :options="paymentMethods.map((value) => ({ label: value, value }))"
        :label="t('form.payment.methodLabel')"
        required
        :error="errors.paymentMethod"
        :class="{ 'sm:col-span-2': !shouldShowDpAmount }"
      />
    </div>

    <UiTextarea
      v-model="notes"
      :label="t('common.notes')"
      :help="t('expense.optional')"
      :error="errors.notes"
      :rows="3"
    />

    <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" :disabled="submitting" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" icon="circleCheckBig" :disabled="submitting" block class="sm:w-auto">
        {{ submitting ? t('common.saving') : t('common.save') }}
      </UiButton>
    </div>
  </form>
</template>
