<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

type FormValues = {
  date: string
  coopId: string
  collectionTime: string
  goodKg: string
  goodCount: string
  brokenCount: string
  notes: string
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

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
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
  const schema = z.object({
    date: z.string().min(1, t('validation.required.date')),
    coopId: z.string().min(1, t('validation.required.coop')),
    collectionTime: z.string().min(1, t('validation.required.collectionTime')),
    goodKg: z.coerce.number().min(0, t('validation.min.zero')),
    goodCount: z.coerce.number().int().min(0, t('validation.min.zero')),
    brokenCount: z.coerce.number().int().min(0, t('validation.min.zero')).optional(),
    notes: z.string().optional(),
  })
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  emit('submit', {
    ...(props.isEdit ? {} : {
      date: parsed.data.date,
      coopId: parsed.data.coopId,
      collectionTime: parsed.data.collectionTime,
    }),
    goodKg: parsed.data.goodKg,
    goodCount: parsed.data.goodCount,
    brokenCount: values.brokenCount ? parsed.data.brokenCount : undefined,
    notes: parsed.data.notes || undefined,
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
    <UiInput v-model="goodKg" type="number" :label="t('form.production.goodWeight')" :error="errors.goodKg" />
    <UiInput v-model="goodCount" type="number" :label="t('form.production.goodCount')" :error="errors.goodCount" />
    <UiInput v-model="brokenCount" type="number" :label="t('form.production.brokenCount')" :error="errors.brokenCount" />
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
