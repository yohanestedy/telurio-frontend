<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import type { CoopHealthRecordType } from '../../types/domain'

type FormValues = {
  date: string
  coopId: string
  type: CoopHealthRecordType | ''
  description: string
  notes: string
}

const props = defineProps<{
  coopOptions: Array<{ label: string; value: string }>
  typeOptions: Array<{ label: string; value: CoopHealthRecordType }>
  initialValue?: Partial<FormValues>
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [{ date: string; coopId: string; type: CoopHealthRecordType; description: string; notes?: string }]
}>()

const { t } = useI18n()

const validationSchema = toTypedSchema(z.object({
  date: z.string().min(1, t('validation.required.date')),
  coopId: z.string().min(1, t('validation.required.coop')),
  type: z.enum(['VITAMIN', 'VACCINE', 'MEDICINE'], {
    message: t('coopHealth.validation.typeRequired'),
  }),
  description: z.string().min(1, t('coopHealth.validation.descriptionRequired')).max(255),
  notes: z.string().max(1000).optional(),
}))

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues>({
  validationSchema,
  initialValues: { date: '', coopId: '', type: '', description: '', notes: '' },
})

const [date] = defineField('date')
const [coopId] = defineField('coopId')
const [type] = defineField('type')
const [description] = defineField('description')
const [notes] = defineField('notes')

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        date: value?.date ?? '',
        coopId: value?.coopId ?? '',
        type: value?.type ?? '',
        description: value?.description ?? '',
        notes: value?.notes ?? '',
      },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    date: values.date,
    coopId: values.coopId,
    type: values.type as CoopHealthRecordType,
    description: values.description,
    notes: values.notes || undefined,
  })
})
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <UiDatePicker v-model="date" :label="t('common.date')" :error="errors.date" />
    <UiSelect v-model="coopId" :options="coopOptions" :label="t('common.coop')" :error="errors.coopId" />
    <UiSelect v-model="type" :options="typeOptions" :label="t('coopHealth.type')" :error="errors.type" />
    <UiInput v-model="description" :label="t('coopHealth.descriptionField')" :error="errors.description" />
    <div class="md:col-span-2">
      <UiTextarea v-model="notes" :label="t('common.notes')" :error="errors.notes" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting" type="submit">{{ submitting ? t('common.saving') : t('coopHealth.save') }}</UiButton>
    </div>
  </form>
</template>
