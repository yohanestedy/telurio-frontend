<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { paymentMethods, paymentStatuses } from '../../types/domain'
import { mapZodErrors } from '../../utils/form'

const createSchema = z
  .object({
    customerId: z.string().min(1, 'Pelanggan wajib dipilih'),
    quantityKg: z.coerce.number().min(0.001, 'Jumlah minimal 0.001 kg'),
    deliveryDate: z.string().min(1, 'Tanggal wajib diisi'),
    deliverBefore: z.string().optional(),
    paymentStatus: z.enum(paymentStatuses).optional(),
    paymentMethod: z.enum(paymentMethods).optional(),
    dpAmount: z.coerce.number().min(0, 'DP tidak boleh negatif').optional(),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
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

const props = defineProps<{
  customerOptions: Array<{ label: string; value: string }>
  initialValue?: Partial<FormValues>
  submitting?: boolean
  isEdit?: boolean
}>()

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

watch(
  () => props.initialValue,
  (value) => {
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
  { immediate: true, deep: true },
)

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
        paymentStatus: parsed.data.paymentStatus || undefined,
        paymentMethod: parsed.data.paymentMethod || undefined,
        dpAmount: values.dpAmount ? parsed.data.dpAmount : undefined,
        notes: parsed.data.notes || undefined,
      })
})
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <UiSelect
      v-if="!isEdit"
      v-model="customerId"
      :options="customerOptions"
      label="Pelanggan"
      placeholder="Pilih pelanggan"
      :error="errors.customerId"
    />
    <UiInput v-model="quantityKg" label="Jumlah kg" type="number" :error="errors.quantityKg" />
    <UiInput v-model="deliveryDate" label="Tanggal kirim" type="date" :error="errors.deliveryDate" />
    <UiInput v-model="deliverBefore" label="Antar sebelum" placeholder="09:00" :error="errors.deliverBefore" />
    <UiSelect
      v-if="!isEdit"
      v-model="paymentStatus"
      :options="paymentStatuses.map((value) => ({ label: paymentStatusLabel(value), value }))"
      label="Status pembayaran awal"
      :error="errors.paymentStatus"
    />
    <UiSelect
      v-if="!isEdit"
      v-model="paymentMethod"
      :options="paymentMethods.map((value) => ({ label: value, value }))"
      label="Metode pembayaran"
      placeholder="Opsional"
      :error="errors.paymentMethod"
    />
    <UiInput
      v-if="!isEdit && paymentStatus === 'DP'"
      v-model="dpAmount"
      label="Jumlah DP"
      type="number"
      :error="errors.dpAmount"
    />
    <div class="md:col-span-2">
      <UiTextarea v-model="notes" label="Catatan" :error="errors.notes" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? 'Menyimpan...' : 'Simpan order' }}
      </UiButton>
    </div>
  </form>
</template>
