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
  cancel: []
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
  <form class="space-y-5" @submit.prevent="onSubmit">
    <div class="grid gap-4" :class="!isEdit ? 'sm:grid-cols-2' : ''">
      <UiDatePicker
        v-if="!isEdit"
        v-model="effectiveDate"
        :label="t('form.price.effectiveDate')"
        :placeholder="t('form.price.pickEffectiveDate')"
        :max="todayIso"
        required
        :error="errors.effectiveDate"
      />
      <UiInput
        v-model="pricePerKg"
        thousand-separator
        prefix="Rp"
        :label="t('form.price.pricePerKg')"
        placeholder="0"
        required
        :error="errors.pricePerKg"
      />
    </div>

    <UiTextarea v-model="notes" :label="t('common.notes')" :help="t('expense.optional')" :error="errors.notes" />

    <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" icon="circleCheckBig" :disabled="submitting" block class="sm:w-auto">
        {{ submitting ? t('common.saving') : t('form.price.save') }}
      </UiButton>
    </div>
  </form>
</template>
