<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { paymentMethods, paymentStatuses } from '../../types/domain'
import { mapZodErrors } from '../../utils/form'

const schema = z
  .object({
    paymentStatus: z.enum(paymentStatuses),
    paymentMethod: z.enum(paymentMethods).optional(),
    amountPaid: z.coerce.number().min(0, 'Jumlah tidak boleh negatif').optional(),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
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
  paymentStatus: string
  paymentMethod: string
  amountPaid: string
  notes: string
}

const props = defineProps<{
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [{ paymentStatus: string; paymentMethod?: string; amountPaid?: number; notes?: string }]
}>()

const { defineField, errors, handleSubmit, setErrors, resetForm } = useForm<FormValues>({
  initialValues: {
    paymentStatus: 'DP',
    paymentMethod: '',
    amountPaid: '',
    notes: '',
  },
})

const [paymentStatus] = defineField('paymentStatus')
const [paymentMethod] = defineField('paymentMethod')
const [amountPaid] = defineField('amountPaid')
const [notes] = defineField('notes')

const onSubmit = handleSubmit((values) => {
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  emit('submit', {
    paymentStatus: parsed.data.paymentStatus,
    paymentMethod: parsed.data.paymentMethod || undefined,
    amountPaid: values.amountPaid ? parsed.data.amountPaid : undefined,
    notes: parsed.data.notes || undefined,
  })
  resetForm()
})
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <UiSelect
      v-model="paymentStatus"
      :options="paymentStatuses.map((value) => ({ label: paymentStatusLabel(value), value }))"
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
    <UiInput v-model="amountPaid" label="Jumlah dibayar" type="number" :error="errors.amountPaid" />
    <div class="md:col-span-2">
      <UiTextarea v-model="notes" label="Catatan" :error="errors.notes" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? 'Menyimpan...' : 'Update pembayaran' }}
      </UiButton>
    </div>
  </form>
</template>
