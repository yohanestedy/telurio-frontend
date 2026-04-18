<script setup lang="ts">
import dayjs from 'dayjs'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { paymentMethods, paymentStatuses } from '../../types/domain'
import { mapZodErrors } from '../../utils/form'
import type { AppIconName } from '../../utils/icons'

const createSchema = z
  .object({
    customerId: z.string().min(1, 'Pelanggan wajib dipilih'),
    quantityKg: z.coerce.number().min(0.001, 'Jumlah minimal 0.001 kg'),
    deliveryDate: z.string().min(1, 'Tanggal wajib diisi'),
    deliverBefore: z.string().optional(),
    paymentStatus: z.enum(paymentStatuses),
    paymentMethod: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.enum(paymentMethods).optional(),
    ),
    dpAmount: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.coerce.number().min(0, 'DP tidak boleh negatif').optional(),
    ),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const deliveryDate = dayjs(value.deliveryDate).startOf('day')
    if (deliveryDate.isValid() && deliveryDate.isAfter(dayjs().startOf('day')) && value.paymentStatus === 'LUNAS') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentStatus'],
        message: 'Status Lunas hanya bisa untuk pengiriman hari ini',
      })
    }

    if (value.paymentStatus === 'DP') {
      if (!value.paymentMethod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['paymentMethod'],
          message: 'Metode pembayaran wajib untuk DP',
        })
      }
      if (value.dpAmount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dpAmount'],
          message: 'Jumlah DP wajib diisi',
        })
      }
    }

    if (value.paymentStatus === 'LUNAS' && !value.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentMethod'],
        message: 'Metode pembayaran wajib untuk Lunas',
      })
    }
  })

const updateSchema = z.object({
  quantityKg: z.coerce.number().min(0.001, 'Jumlah minimal 0.001 kg'),
  deliveryDate: z.string().min(1, 'Tanggal wajib diisi'),
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

const props = withDefaults(defineProps<{
  customerOptions: Array<{ label: string; value: string }>
  initialValue?: Partial<FormValues>
  submitting?: boolean
  isEdit?: boolean
  combinedAvailableKg?: string | null
}>(), {
  combinedAvailableKg: null,
})

const emit = defineEmits<{
  submit: [Record<string, string | number | undefined>]
}>()

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
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
  if (value === null) {
    return '-'
  }

  return Number(value).toFixed(3)
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
  },
  { immediate: true },
)

watch(deliveryDate, () => {
  if (isFutureDelivery.value && paymentStatus.value === 'LUNAS') {
    paymentStatus.value = 'BELUM_BAYAR'
  }
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
  const parsed = (props.isEdit ? updateSchema : createSchema).safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  emit('submit', props.isEdit
    ? {
        quantityKg: parsed.data.quantityKg,
        deliveryDate: parsed.data.deliveryDate,
        deliverBefore: parsed.data.deliverBefore || undefined,
        notes: parsed.data.notes || undefined,
      }
    : {
        customerId: parsed.data.customerId,
        quantityKg: parsed.data.quantityKg,
        deliveryDate: parsed.data.deliveryDate,
        deliverBefore: parsed.data.deliverBefore || undefined,
        paymentStatus: parsed.data.paymentStatus,
        ...(parsed.data.paymentStatus === 'BELUM_BAYAR'
          ? {}
          : { paymentMethod: parsed.data.paymentMethod || undefined }),
        ...(parsed.data.paymentStatus === 'DP'
          ? { dpAmount: parsed.data.dpAmount }
          : {}),
        notes: parsed.data.notes || undefined,
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
        label="Pilih pelanggan"
        placeholder="Pilih nama pelanggan..."
        :error="errors.customerId"
      />
      <UiInput v-model="quantityKg" label="Kuantitas (kg)" type="number" :error="errors.quantityKg" placeholder="0.00" />
    </div>

    <div class="rounded-3xl border border-white/50 bg-white/55 p-4 sm:p-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <UiDatePicker
          v-model="deliveryDate"
          label="Tanggal antar"
          placeholder="Pilih tanggal kirim"
          :error="errors.deliveryDate"
        />
        <UiTimePicker
          v-model="deliverBefore"
          label="Antar sebelum"
          placeholder="--:--"
          :error="errors.deliverBefore"
        />
      </div>
    </div>

    <div
      v-if="showCombinedStockWarning"
      class="rounded-2xl border border-amber-300 bg-amber-50/80 px-4 py-3 text-sm text-amber-800"
    >
      Order tetap bisa dibuat, tapi alokasi tidak bisa dilakukan sebelum stok cukup.
      Stok gabungan saat ini {{ formatKg(combinedAvailableKgValue) }} kg,
      permintaan {{ formatKg(enteredQuantityKg) }} kg
      (kekurangan {{ formatKg(stockShortageKg) }} kg).
    </div>

    <div v-if="!isEdit" class="space-y-3">
      <p class="text-sm font-semibold text-ink-800">Status pembayaran</p>
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
        Untuk tanggal kirim setelah hari ini, status Lunas tidak tersedia.
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
        label="Nominal DP (Rp)"
        type="number"
        placeholder="500000"
        :error="errors.dpAmount"
      />
      <UiSelect
        v-model="paymentMethod"
        :options="paymentMethods.map((value) => ({ label: value, value }))"
        label="Metode pembayaran"
        placeholder="Pilih metode"
        :error="errors.paymentMethod"
        :class="{ 'sm:col-span-2': !shouldShowDpAmount }"
      />
    </div>

    <UiTextarea
      v-model="notes"
      label="Catatan tambahan"
      placeholder="Contoh: packing peti kayu, titip ke satpam, dll..."
      :error="errors.notes"
      :rows="3"
    />

    <div class="flex justify-end">
      <UiButton :disabled="submitting" type="submit" class="min-w-40">
        {{ submitting ? 'Menyimpan...' : 'Simpan pesanan' }}
      </UiButton>
    </div>
  </form>
</template>
