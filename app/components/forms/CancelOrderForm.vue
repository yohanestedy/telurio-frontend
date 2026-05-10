<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'

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
    <UiTextarea v-model="cancelReason" label="Alasan pembatalan" :error="errors.cancelReason" />
    <UiTextarea v-model="cancelNotes" label="Catatan tambahan" :error="errors.cancelNotes" />
    <div class="flex justify-end">
      <UiButton variant="destructive" :disabled="submitting" type="submit">
        {{ submitting ? 'Membatalkan...' : 'Batalkan order' }}
      </UiButton>
    </div>
  </form>
</template>
