<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import dayjs from 'dayjs'

type FormValues = {
  effectiveDate: string
  pricePerKg: string
  notes: string
}

type SubmitValues = {
  effectiveDate: string
  pricePerKg: number
  notes?: string
}

const props = defineProps<{
  initialValue?: Partial<FormValues>
  submitting?: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  submit: [{ effectiveDate?: string; pricePerKg: number; notes?: string }]
}>()

const { t } = useI18n()

const todayIso = dayjs().format('YYYY-MM-DD')

const validationSchema = toTypedSchema(z.object({
  effectiveDate: z.string().min(1, t('validation.required.date')),
  pricePerKg: z.coerce.number().min(5000, 'Harga per kg minimal Rp 5.000'),
  notes: z.string().optional(),
}))

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues, SubmitValues>({
  validationSchema,
  initialValues: {
    effectiveDate: '',
    pricePerKg: '',
    notes: '',
  },
})

const [effectiveDate] = defineField('effectiveDate')
const [pricePerKg] = defineField('pricePerKg')
const [notes] = defineField('notes')

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        effectiveDate: value?.effectiveDate ?? '',
        pricePerKg: value?.pricePerKg ?? '',
        notes: value?.notes ?? '',
      },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    effectiveDate: props.isEdit ? undefined : values.effectiveDate,
    pricePerKg: values.pricePerKg,
    notes: values.notes || undefined,
  })
})
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <UiDatePicker
      v-if="!isEdit"
      v-model="effectiveDate"
      :label="t('form.price.effectiveDate')"
      :placeholder="t('form.price.pickEffectiveDate')"
      :max="todayIso"
      :error="errors.effectiveDate"
    />
    <UiInput v-model="pricePerKg" :label="t('form.price.pricePerKg')" type="number" min="5000" step="1" :error="errors.pricePerKg" />
    <div :class="{ 'md:col-span-2': !isEdit }">
      <UiTextarea v-model="notes" :label="t('common.notes')" :error="errors.notes" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? t('common.saving') : t('form.price.save') }}
      </UiButton>
    </div>
  </form>
</template>
