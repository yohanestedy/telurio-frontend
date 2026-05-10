<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'

type FormValues = {
  date: string
  coopId: string
  collectionTime: string
  goodKg: string
  goodCount: string
  brokenCount: string
  notes: string
}

type SubmitValues = {
  date: string
  coopId: string
  collectionTime: string
  goodKg: number
  goodCount: number
  brokenCount?: number
  notes?: string
}

const props = defineProps<{
  coopOptions: Array<{ label: string; value: string }>
  initialValue?: Partial<FormValues>
  submitting?: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  submit: [
    {
      date?: string
      coopId?: string
      collectionTime?: string
      goodKg: number
      goodCount: number
      brokenCount?: number
      notes?: string
    },
  ]
}>()

const { t } = useI18n()

const positiveMessage = t('validation.min.positive')
const optionalPositiveInt = z.preprocess(
  (value) => value === '' || value === null || value === undefined ? undefined : value,
  z.coerce.number().int().min(1, positiveMessage).optional(),
)
const validationSchema = toTypedSchema(z.object({
  date: z.string().min(1, t('validation.required.date')),
  coopId: z.string().min(1, t('validation.required.coop')),
  collectionTime: z.string().min(1, t('validation.required.collectionTime')),
  goodKg: z.coerce.number().min(0.001, positiveMessage),
  goodCount: z.coerce.number().int().min(1, positiveMessage),
  brokenCount: optionalPositiveInt,
  notes: z.string().optional(),
}))

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues, SubmitValues>({
  validationSchema,
  initialValues: {
    date: '',
    coopId: '',
    collectionTime: '',
    goodKg: '',
    goodCount: '',
    brokenCount: '',
    notes: '',
  },
})

const [date] = defineField('date')
const [coopId] = defineField('coopId')
const [collectionTime] = defineField('collectionTime')
const [goodKg] = defineField('goodKg')
const [goodCount] = defineField('goodCount')
const [brokenCount] = defineField('brokenCount')
const [notes] = defineField('notes')

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        date: value?.date ?? '',
        coopId: value?.coopId ?? '',
        collectionTime: value?.collectionTime ?? '',
        goodKg: value?.goodKg ?? '',
        goodCount: value?.goodCount ?? '',
        brokenCount: value?.brokenCount ?? '',
        notes: value?.notes ?? '',
      },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    ...(props.isEdit ? {} : {
      date: values.date,
      coopId: values.coopId,
      collectionTime: values.collectionTime,
    }),
    goodKg: values.goodKg,
    goodCount: values.goodCount,
    brokenCount: values.brokenCount,
    notes: values.notes || undefined,
  })
})
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <UiDatePicker
      v-if="!isEdit"
      v-model="date"
      :label="t('common.date')"
      :placeholder="t('date.placeholder')"
      :error="errors.date"
    />
    <UiSelect
      v-if="!isEdit"
      v-model="coopId"
      :options="coopOptions"
      :label="t('common.coop')"
      :placeholder="t('validation.required.coop')"
      :error="errors.coopId"
    />
    <UiInput
      v-if="!isEdit"
      v-model="collectionTime"
      :label="t('form.production.collectionTime')"
      placeholder="07:00"
      :error="errors.collectionTime"
    />
    <UiInput v-model="goodKg" type="number" min="0.001" step="0.001" :label="t('form.production.goodWeight')" :error="errors.goodKg" />
    <UiInput v-model="goodCount" type="number" min="1" step="1" :label="t('form.production.goodCount')" :error="errors.goodCount" />
    <UiInput v-model="brokenCount" type="number" min="1" step="1" :label="t('form.production.brokenCount')" :error="errors.brokenCount" />
    <div class="md:col-span-2">
      <UiTextarea v-model="notes" :label="t('common.notes')" :error="errors.notes" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? t('common.saving') : t('form.production.save') }}
      </UiButton>
    </div>
  </form>
</template>
