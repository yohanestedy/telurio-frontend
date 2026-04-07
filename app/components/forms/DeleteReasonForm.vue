<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

const schema = z.object({
  deleteReason: z.string().min(3, 'Alasan minimal 3 karakter'),
})

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

const { defineField, errors, handleSubmit, setErrors, resetForm } = useForm<FormValues>({
  initialValues: {
    deleteReason: '',
  },
})

const [deleteReason] = defineField('deleteReason')

const onSubmit = handleSubmit((values) => {
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  emit('submit', parsed.data)
  resetForm()
})
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <UiTextarea
      v-model="deleteReason"
      :label="label ?? 'Alasan penghapusan'"
      :error="errors.deleteReason"
    />
    <div class="flex justify-end">
      <UiButton variant="destructive" :disabled="submitting" type="submit">
        {{ submitting ? 'Memproses...' : 'Konfirmasi hapus' }}
      </UiButton>
    </div>
  </form>
</template>
