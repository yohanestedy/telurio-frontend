<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { paymentMethods, paymentStatuses } from '../../types/domain'
import type { PaymentMethod, PaymentStatus } from '../../types/domain'
import type { AppIconName } from '../../utils/icons'

const { t } = useI18n()

function toMoneyNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const normalized = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(normalized) ? normalized : 0
}

type FormValues = {
  paymentStatus: PaymentStatus
  paymentMethod: string
  amountPaid: string
  notes: string
}

type SubmitValues = {
  paymentStatus: PaymentStatus
  paymentMethod?: string
  amountPaid?: number
  notes?: string
}

const props = defineProps<{
  submitting?: boolean
  currentPaymentStatus: PaymentStatus
  totalInvoice: string | number | null
  pricePerKg: string | number | null
  dpAmount: string | number | null
}>()

const emit = defineEmits<{
  submit: [{ paymentStatus: string; paymentMethod?: string; amountPaid?: number; notes?: string }]
}>()

const hasPrice = computed(() =>
  props.pricePerKg !== null && props.pricePerKg !== '' && toMoneyNumber(props.pricePerKg) > 0,
)
const dpRecorded = computed(() => props.dpAmount !== null && props.dpAmount !== '')
const totalInvoiceValue = computed(() => toMoneyNumber(props.totalInvoice))
const pricePerKgValue = computed(() => toMoneyNumber(props.pricePerKg))
const dpPaidValue = computed(() => toMoneyNumber(props.dpAmount))
const currentPaidValue = computed(() => (props.currentPaymentStatus === 'DP' ? dpPaidValue.value : 0))
const remainingBeforeValue = computed(() => Math.max(totalInvoiceValue.value - currentPaidValue.value, 0))

const validationSchema = computed(() => toTypedSchema(z
  .object({
    paymentStatus: z.enum(paymentStatuses),
    paymentMethod: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.enum(paymentMethods).optional(),
    ),
    amountPaid: z.preprocess(
      (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
      z.number().min(1000, t('validation.payment.amountMin')).optional(),
    ),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const allowed =
      props.currentPaymentStatus === 'BELUM_BAYAR'
        ? hasPrice.value
          ? ['DP', 'LUNAS']
          : ['DP']
        : props.currentPaymentStatus === 'DP'
          ? hasPrice.value
            ? ['LUNAS']
            : []
          : []

    if (!allowed.includes(value.paymentStatus)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentStatus'],
        message: t('validation.payment.statusInvalid'),
      })
    }

    if (value.paymentStatus === 'LUNAS' && !hasPrice.value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentStatus'],
        message: t('validation.payment.priceRequiredForLunas'),
      })
    }

    if (value.paymentStatus === 'DP') {
      if (!value.paymentMethod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['paymentMethod'],
          message: t('validation.payment.methodRequired'),
        })
      }
      if (value.amountPaid === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amountPaid'],
          message: t('validation.payment.amountRequired'),
        })
      } else {
        if (!Number.isInteger(value.amountPaid)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['amountPaid'],
            message: t('validation.payment.amountInteger'),
          })
        }

        if (value.amountPaid < 1000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['amountPaid'],
            message: t('validation.payment.amountMin'),
          })
        }

        if (value.amountPaid <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['amountPaid'],
            message: t('validation.payment.amountPositive'),
          })
        }

        if (totalInvoiceValue.value > 0 && value.amountPaid > remainingBeforeValue.value) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['amountPaid'],
            message: t('validation.payment.amountExceedsRemaining'),
          })
        }
      }
    }

    if (value.paymentStatus === 'LUNAS' && !value.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentMethod'],
        message: t('validation.payment.methodRequired'),
      })
    }
  })))

const statusOptions = computed(() => {
  if (props.currentPaymentStatus === 'BELUM_BAYAR') {
    return hasPrice.value
      ? (['DP', 'LUNAS'] as PaymentStatus[])
      : (['DP'] as PaymentStatus[])
  }

  if (props.currentPaymentStatus === 'DP') {
    return hasPrice.value ? (['LUNAS'] as PaymentStatus[]) : ([] as PaymentStatus[])
  }

  return [] as PaymentStatus[]
})

const defaultNextStatus = computed<PaymentStatus>(() => {
  if (props.currentPaymentStatus === 'DP') {
    return 'LUNAS'
  }

  return 'DP'
})

const statusIcons: Record<PaymentStatus, AppIconName> = {
  BELUM_BAYAR: 'clock',
  DP: 'money',
  LUNAS: 'wallet',
}

const methodIcons: Record<PaymentMethod, AppIconName> = {
  CASH: 'money',
  TRANSFER: 'wallet',
}

const statusCards = computed(() =>
  statusOptions.value.map((value) => ({
    value,
    label: paymentStatusLabel(value),
    icon: statusIcons[value],
  })),
)

const methodCards = computed(() =>
  paymentMethods.map((value) => ({
    value,
    label: t(`form.payment.method.${value}`),
    icon: methodIcons[value],
  })),
)

const { defineField, errors, handleSubmit, resetForm, setFieldValue } = useForm<FormValues, SubmitValues>({
  validationSchema,
  initialValues: {
    paymentStatus: defaultNextStatus.value,
    paymentMethod: '',
    amountPaid: '',
    notes: '',
  },
})

const [paymentStatus] = defineField('paymentStatus')
const [paymentMethod] = defineField('paymentMethod')
const [amountPaid] = defineField('amountPaid')
const [notes] = defineField('notes')

const showAmountInput = computed(() => paymentStatus.value === 'DP')
const autoLunasAmount = computed(() => Math.round(remainingBeforeValue.value))

const paidNowPreview = computed(() => {
  if (paymentStatus.value === 'LUNAS') {
    return autoLunasAmount.value
  }

  return Math.max(toMoneyNumber(amountPaid.value), 0)
})

const remainingAfterPreview = computed(() =>
  Math.max(remainingBeforeValue.value - paidNowPreview.value, 0),
)

watch(
  () => [props.currentPaymentStatus, props.totalInvoice, props.dpAmount],
  () => {
    resetForm({
      values: {
        paymentStatus: defaultNextStatus.value,
        paymentMethod: '',
        amountPaid: '',
        notes: '',
      },
    })
  },
  { immediate: true },
)

watch(
  () => [paymentStatus.value, autoLunasAmount.value],
  ([nextStatus, lunasAmount]) => {
    if (nextStatus === 'LUNAS') {
      setFieldValue('amountPaid', String(lunasAmount))
      return
    }

    if (nextStatus === 'DP' && toMoneyNumber(amountPaid.value) === lunasAmount) {
      setFieldValue('amountPaid', '')
    }
  },
)

const onSubmit = handleSubmit((values) => {
  const amountForSubmit =
    values.paymentStatus === 'LUNAS'
      ? autoLunasAmount.value
      : values.amountPaid

  emit('submit', {
    paymentStatus: values.paymentStatus,
    paymentMethod: values.paymentMethod || undefined,
    amountPaid: amountForSubmit,
    notes: values.notes || undefined,
  })

  resetForm({
    values: {
      paymentStatus: defaultNextStatus.value,
      paymentMethod: '',
      amountPaid: '',
      notes: '',
    },
  })
})
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <div class="md:col-span-2 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">{{ t('form.payment.summaryTitle') }}</p>
      <div class="mt-3 flex flex-wrap gap-3">
        <div class="min-w-[140px] flex-1 rounded-xl bg-white/80 p-3">
          <p class="text-[11px] uppercase tracking-wide text-ink-500">{{ t('form.payment.currentStatus') }}</p>
          <p class="mt-1 text-sm font-semibold text-ink-900">{{ paymentStatusLabel(currentPaymentStatus) }}</p>
        </div>
        <div class="min-w-[140px] flex-1 rounded-xl bg-white/80 p-3">
          <p class="text-[11px] uppercase tracking-wide text-ink-500">{{ t('form.payment.pricePerKg') }}</p>
          <p class="mt-1 text-sm font-semibold text-ink-900">{{ hasPrice ? formatRupiah(pricePerKgValue) : t('form.payment.priceNotLocked') }}</p>
        </div>
        <div class="min-w-[140px] flex-1 rounded-xl bg-white/80 p-3">
          <p class="text-[11px] uppercase tracking-wide text-ink-500">{{ t('form.payment.totalInvoice') }}</p>
          <p class="mt-1 text-sm font-semibold text-ink-900">{{ hasPrice ? formatRupiah(totalInvoiceValue) : t('form.payment.invoicePending') }}</p>
        </div>
        <div v-if="dpRecorded" class="min-w-[140px] flex-1 rounded-xl bg-white/80 p-3">
          <p class="text-[11px] uppercase tracking-wide text-ink-500">{{ t('form.payment.dpReceived') }}</p>
          <p class="mt-1 text-sm font-semibold text-ink-900">{{ formatRupiah(currentPaidValue) }}</p>
        </div>
        <div v-if="dpRecorded" class="min-w-[140px] flex-1 rounded-xl bg-white/80 p-3">
          <p class="text-[11px] uppercase tracking-wide text-ink-500">{{ t('form.payment.remaining') }}</p>
          <p class="mt-1 text-sm font-semibold text-ink-900">{{ formatRupiah(remainingBeforeValue) }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="!hasPrice"
      class="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-3"
    >
      <p class="text-xs font-medium text-amber-800">
        {{ t('form.payment.priceLockedHint') }}
      </p>
    </div>

    <div class="md:col-span-2 space-y-3">
      <p class="text-sm font-semibold text-ink-800">{{ t('form.payment.statusLabel') }}</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <button
          v-for="option in statusCards"
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
      <p v-if="errors.paymentStatus" class="text-xs font-medium text-rose-600">
        {{ errors.paymentStatus }}
      </p>
    </div>

    <div class="md:col-span-2 space-y-3">
      <p class="text-sm font-semibold text-ink-800">{{ t('form.payment.methodLabel') }}</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <button
          v-for="option in methodCards"
          :key="option.value"
          type="button"
          class="rounded-2xl border px-4 py-3 text-left transition"
          :class="paymentMethod === option.value
            ? 'border-amber-400 bg-amber-50 shadow-[0_8px_20px_rgba(251,191,36,0.22)]'
            : 'border-white/60 bg-white/60 hover:bg-white/85'"
          @click="paymentMethod = option.value"
        >
          <div class="flex items-center gap-2">
            <UiIcon :name="option.icon" class="h-4 w-4 text-ink-600" />
            <p class="text-sm font-semibold text-ink-900">{{ option.label }}</p>
          </div>
        </button>
      </div>
      <p v-if="errors.paymentMethod" class="text-xs font-medium text-rose-600">
        {{ errors.paymentMethod }}
      </p>
    </div>

    <UiInput
      v-if="showAmountInput"
      v-model="amountPaid"
      :label="t('form.payment.dpAmount')"
      type="number"
      min="1000"
      step="1"
      :error="errors.amountPaid"
      :placeholder="t('form.payment.dpAmountPlaceholder')"
      class="md:col-span-2"
    />

    <div
      v-else
      class="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 md:col-span-2"
    >
      <p class="text-xs uppercase tracking-wide text-emerald-700">{{ t('form.payment.autoLunasTitle') }}</p>
      <p class="mt-1 text-sm font-semibold text-emerald-900">{{ formatRupiah(autoLunasAmount) }}</p>
      <p class="mt-1 text-xs text-emerald-700">
        {{ t('form.payment.autoLunasHint') }}
      </p>
    </div>

    <div class="rounded-2xl border border-white/70 bg-white/70 p-3 md:col-span-2">
      <p class="text-xs uppercase tracking-wide text-ink-500">{{ t('form.payment.previewTitle') }}</p>
      <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span class="font-medium text-ink-900">{{ t('form.payment.paidNow') }}:</span>
        <span class="font-semibold text-brand-700">{{ formatRupiah(paidNowPreview) }}</span>
        <span class="text-ink-400">•</span>
        <span class="font-medium text-ink-900">{{ t('form.payment.remainingAfter') }}:</span>
        <span class="font-semibold text-ink-700">{{ formatRupiah(remainingAfterPreview) }}</span>
      </div>
    </div>

    <div class="md:col-span-2">
      <UiTextarea v-model="notes" :label="t('common.notes')" :error="errors.notes" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting || !statusOptions.length" type="submit">
        {{ submitting ? t('common.saving') : t('form.payment.submit') }}
      </UiButton>
    </div>
  </form>
</template>
