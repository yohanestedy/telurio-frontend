<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Password lama wajib diisi'),
    newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password wajib diisi'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Konfirmasi password tidak cocok',
  })

type FormValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const props = defineProps<{
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [{ currentPassword: string; newPassword: string }]
}>()

const { defineField, errors, handleSubmit, setErrors, resetForm } = useForm<FormValues>({
  initialValues: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
})

const [currentPassword] = defineField('currentPassword')
const [newPassword] = defineField('newPassword')
const [confirmPassword] = defineField('confirmPassword')

const onSubmit = handleSubmit((values) => {
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  emit('submit', {
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
  })
  resetForm()
})
</script>

<template>
  <form class="grid gap-4" @submit.prevent="onSubmit">
    <UiInput v-model="currentPassword" label="Password saat ini" type="password" :error="errors.currentPassword" />
    <UiInput v-model="newPassword" label="Password baru" type="password" :error="errors.newPassword" />
    <UiInput
      v-model="confirmPassword"
      label="Ulangi password baru"
      type="password"
      :error="errors.confirmPassword"
    />
    <div class="flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? 'Menyimpan...' : 'Ubah password' }}
      </UiButton>
    </div>
  </form>
</template>
