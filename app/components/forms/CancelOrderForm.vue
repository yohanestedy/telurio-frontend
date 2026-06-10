<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'

const { t } = useI18n()

const schema = toTypedSchema(z.object({
  cancelReason: z.string().min(3, 'Alasan minimal 3 karakter'),
  cancelNotes: z.string().optional(),
}))

type FormValues = {
  cancelReason: string
  cancelNotes: string
}

const props = defineProps<{
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [{ cancelReason: string; cancelNotes?: string }]
  cancel: []
}>()

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues>({
  initialValues: {
    cancelReason: '',
    cancelNotes: '',
  },
  validationSchema: schema,
})

const [cancelReason] = defineField('cancelReason')
const [cancelNotes] = defineField('cancelNotes')

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    cancelReason: values.cancelReason,
    cancelNotes: values.cancelNotes || undefined,
  })
  resetForm()
})
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <UiTextarea v-model="cancelReason" :label="t('delete.reason')" :error="errors.cancelReason" />
    <UiTextarea v-model="cancelNotes" :label="t('common.notes')" :help="t('expense.optional')" :error="errors.cancelNotes" />
    <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" :disabled="submitting" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton variant="destructive" icon="circleX" :disabled="submitting" block class="sm:w-auto" type="submit">
        {{ submitting ? t('common.processing') : t('order.action.cancel') }}
      </UiButton>
    </div>
  </form>
</template>
