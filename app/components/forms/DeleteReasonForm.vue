<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

type FormValues = {
  deleteReason: string
}

const props = defineProps<{
  submitting?: boolean
  label?: string
}>()

const emit = defineEmits<{
  submit: [{ deleteReason: string }]
}>()

const { t } = useI18n()

const validationSchema = toTypedSchema(z.object({
  deleteReason: z.string().min(3, t('validation.reasonMin', { min: '3' })),
}))

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues>({
  initialValues: {
    deleteReason: '',
  },
  validationSchema,
})

const [deleteReason] = defineField('deleteReason')

const onSubmit = handleSubmit((values) => {
  emit('submit', values)
  resetForm()
})
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <UiTextarea
      v-model="deleteReason"
      :label="label ?? t('delete.reason')"
      :error="errors.deleteReason"
    />
    <div class="flex justify-end">
      <UiButton variant="destructive" :disabled="submitting" type="submit">
        {{ submitting ? t('common.processing') : t('delete.confirm') }}
      </UiButton>
    </div>
  </form>
</template>
