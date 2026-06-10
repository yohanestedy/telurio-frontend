<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import dayjs from 'dayjs'
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
  cancel: []
}>()

const { t } = useI18n()

const todayIso = dayjs().format('YYYY-MM-DD')

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
  <form class="space-y-5" @submit.prevent="onSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <UiDatePicker v-model="date" :label="t('common.date')" :max="todayIso" required :error="errors.date" />
      <UiSelect v-model="coopId" :options="coopOptions" :label="t('common.coop')" required :error="errors.coopId" />
      <UiSelect v-model="type" :options="typeOptions" :label="t('coopHealth.type')" required :error="errors.type" />
      <UiInput v-model="description" :label="t('coopHealth.descriptionField')" required :error="errors.description" />
    </div>

    <UiTextarea v-model="notes" :label="t('common.notes')" :help="t('expense.optional')" :error="errors.notes" />

    <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" icon="circleCheckBig" :disabled="submitting" block class="sm:w-auto">
        {{ submitting ? t('common.saving') : t('coopHealth.save') }}
      </UiButton>
    </div>
  </form>
</template>
