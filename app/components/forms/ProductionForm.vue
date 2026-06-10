<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import dayjs from 'dayjs'

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
  cancel: []
}>()

const { t } = useI18n()

const todayIso = dayjs().format('YYYY-MM-DD')

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
  <form class="space-y-5" @submit.prevent="onSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <UiDatePicker
        v-if="!isEdit"
        v-model="date"
        :label="t('common.date')"
        :placeholder="t('date.placeholder')"
        :max="todayIso"
        required
        :error="errors.date"
      />
      <UiSelect
        v-if="!isEdit"
        v-model="coopId"
        :options="coopOptions"
        :label="t('common.coop')"
        :placeholder="t('validation.required.coop')"
        required
        :error="errors.coopId"
      />
      <UiTimePicker
        v-if="!isEdit"
        v-model="collectionTime"
        :label="t('form.production.collectionTime')"
        placeholder="07:00"
        :error="errors.collectionTime"
      />
      <UiInput
        v-model="goodKg"
        type="number"
        min="0.001"
        step="0.001"
        inputmode="decimal"
        :label="t('form.production.goodWeight')"
        required
        :error="errors.goodKg"
      />
      <UiInput
        v-model="goodCount"
        type="number"
        min="1"
        step="1"
        inputmode="numeric"
        :label="t('form.production.goodCount')"
        required
        :error="errors.goodCount"
      />
      <UiInput
        v-model="brokenCount"
        type="number"
        min="1"
        step="1"
        inputmode="numeric"
        :label="t('form.production.brokenCount')"
        :error="errors.brokenCount"
      />
    </div>

    <UiTextarea v-model="notes" :label="t('common.notes')" :help="t('expense.optional')" :error="errors.notes" />

    <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" icon="circleCheckBig" :disabled="submitting" block class="sm:w-auto">
        {{ submitting ? t('common.saving') : t('form.production.save') }}
      </UiButton>
    </div>
  </form>
</template>
