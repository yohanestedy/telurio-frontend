<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { paymentMethods, paymentStatuses } from '../../types/domain'
import type { PaymentStatus } from '../../types/domain'
import { mapZodErrors } from '../../utils/form'

function toMoneyNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const normalized = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(normalized) ? normalized : 0
}

const schema = z
  .object({
    paymentStatus: z.enum(paymentStatuses),
    paymentMethod: z.enum(paymentMethods).optional(),
    amountPaid: z.preprocess(
      (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
      z.number().min(0, 'Jumlah tidak boleh negatif').optional(),
    ),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const allowed =
      props.currentPaymentStatus === 'BELUM_BAYAR'
        ? ['DP', 'LUNAS']
        : props.currentPaymentStatus === 'DP'
          ? ['LUNAS']
          : []

    if (!allowed.includes(value.paymentStatus)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentStatus'],
        message: 'Status pembayaran tidak valid untuk kondisi saat ini',
      })
    }

    if (value.paymentStatus === 'DP') {
      if (!value.paymentMethod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['paymentMethod'],
          message: 'Metode pembayaran wajib diisi',
        })
      }
      if (value.amountPaid === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amountPaid'],
          message: 'Jumlah dibayar wajib diisi',
        })
      } else {
        if (!Number.isInteger(value.amountPaid)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['amountPaid'],
            message: 'Jumlah dibayar harus bilangan bulat',
          })
        }

        if (value.amountPaid <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['amountPaid'],
            message: 'Jumlah DP harus lebih dari 0',
          })
        }

        if (totalInvoiceValue.value > 0 && value.amountPaid > remainingBeforeValue.value) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['amountPaid'],
            message: 'Jumlah DP tidak boleh melebihi sisa pembayaran',
          })
        }
      }
    }

    if (value.paymentStatus === 'LUNAS' && !value.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentMethod'],
        message: 'Metode pembayaran wajib diisi',
      })
    }
  })

type FormValues = {
  paymentStatus: PaymentStatus
  paymentMethod: string
  amountPaid: string
  notes: string
}

const props = defineProps<{
  submitting?: boolean
  currentPaymentStatus: PaymentStatus
  totalInvoice: string | number | null
  dpAmount: string | number | null
}>()

const emit = defineEmits<{
  submit: [{ paymentStatus: string; paymentMethod?: string; amountPaid?: number; notes?: string }]
}>()

const totalInvoiceValue = computed(() => toMoneyNumber(props.totalInvoice))
const dpPaidValue = computed(() => toMoneyNumber(props.dpAmount))
const currentPaidValue = computed(() => (props.currentPaymentStatus === 'DP' ? dpPaidValue.value : 0))
const remainingBeforeValue = computed(() => Math.max(totalInvoiceValue.value - currentPaidValue.value, 0))

const statusOptions = computed(() => {
  if (props.currentPaymentStatus === 'BELUM_BAYAR') {
    return ['DP', 'LUNAS'] as PaymentStatus[]
  }

  if (props.currentPaymentStatus === 'DP') {
    return ['LUNAS'] as PaymentStatus[]
  }

  return [] as PaymentStatus[]
})

const defaultNextStatus = computed<PaymentStatus>(() => {
  if (props.currentPaymentStatus === 'DP') {
    return 'LUNAS'
  }

  return 'DP'
})

const { defineField, errors, handleSubmit, setErrors, resetForm, setFieldValue } = useForm<FormValues>({
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
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  const amountForSubmit =
    parsed.data.paymentStatus === 'LUNAS'
      ? autoLunasAmount.value
      : parsed.data.amountPaid

  emit('submit', {
    paymentStatus: parsed.data.paymentStatus,
    paymentMethod: parsed.data.paymentMethod || undefined,
    amountPaid: amountForSubmit,
    notes: parsed.data.notes || undefined,
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
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Ringkasan pembayaran</p>
      <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl bg-white/80 p-3">
          <p class="text-[11px] uppercase tracking-wide text-ink-500">Status saat ini</p>
          <p class="mt-1 text-sm font-semibold text-ink-900">{{ paymentStatusLabel(currentPaymentStatus) }}</p>
        </div>
        <div class="rounded-xl bg-white/80 p-3">
          <p class="text-[11px] uppercase tracking-wide text-ink-500">Total invoice</p>
          <p class="mt-1 text-sm font-semibold text-ink-900">{{ formatRupiah(totalInvoiceValue) }}</p>
        </div>
        <div class="rounded-xl bg-white/80 p-3">
          <p class="text-[11px] uppercase tracking-wide text-ink-500">DP masuk</p>
          <p class="mt-1 text-sm font-semibold text-ink-900">{{ formatRupiah(currentPaidValue) }}</p>
        </div>
        <div class="rounded-xl bg-white/80 p-3">
          <p class="text-[11px] uppercase tracking-wide text-ink-500">Sisa bayar</p>
          <p class="mt-1 text-sm font-semibold text-ink-900">{{ formatRupiah(remainingBeforeValue) }}</p>
        </div>
      </div>
    </div>

    <UiSelect
      v-model="paymentStatus"
      :options="statusOptions.map((value) => ({ label: paymentStatusLabel(value), value }))"
      label="Status pembayaran"
      :error="errors.paymentStatus"
    />
    <UiSelect
      v-model="paymentMethod"
      :options="paymentMethods.map((value) => ({ label: value, value }))"
      label="Metode pembayaran"
      placeholder="Pilih metode"
      :error="errors.paymentMethod"
    />

    <UiInput
      v-if="showAmountInput"
      v-model="amountPaid"
      label="Nominal DP"
      type="number"
      :error="errors.amountPaid"
      placeholder="Contoh: 100000"
    />

    <div
      v-else
      class="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3"
    >
      <p class="text-xs uppercase tracking-wide text-emerald-700">Nominal pelunasan otomatis</p>
      <p class="mt-1 text-sm font-semibold text-emerald-900">{{ formatRupiah(autoLunasAmount) }}</p>
      <p class="mt-1 text-xs text-emerald-700">
        Nominal pelunasan dihitung otomatis dari sisa pembayaran.
      </p>
    </div>

    <div class="rounded-2xl border border-white/70 bg-white/70 p-3 md:col-span-2">
      <p class="text-xs uppercase tracking-wide text-ink-500">Preview pembayaran</p>
      <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span class="font-medium text-ink-900">Dibayar sekarang:</span>
        <span class="font-semibold text-brand-700">{{ formatRupiah(paidNowPreview) }}</span>
        <span class="text-ink-400">•</span>
        <span class="font-medium text-ink-900">Sisa setelah update:</span>
        <span class="font-semibold text-ink-700">{{ formatRupiah(remainingAfterPreview) }}</span>
      </div>
    </div>

    <div class="md:col-span-2">
      <UiTextarea v-model="notes" label="Catatan" :error="errors.notes" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting || !statusOptions.length" type="submit">
        {{ submitting ? 'Menyimpan...' : 'Update pembayaran' }}
      </UiButton>
    </div>
  </form>
</template>
