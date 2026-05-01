<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

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

const { t } = useI18n()

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
  const schema = z
    .object({
      currentPassword: z.string().min(1, t('validation.required.currentPassword')),
      newPassword: z.string().min(6, t('validation.passwordMin', { min: '6' })),
      confirmPassword: z.string().min(1, t('validation.required.confirmPassword')),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
      path: ['confirmPassword'],
      message: t('validation.passwordMismatch'),
    })

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
    <UiInput v-model="currentPassword" :label="t('password.current')" type="password" :error="errors.currentPassword" />
    <UiInput v-model="newPassword" :label="t('password.new')" type="password" :error="errors.newPassword" />
    <UiInput
      v-model="confirmPassword"
      :label="t('password.confirmNew')"
      type="password"
      :error="errors.confirmPassword"
    />
    <div class="flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? t('common.saving') : t('password.change') }}
      </UiButton>
    </div>
  </form>
</template>
