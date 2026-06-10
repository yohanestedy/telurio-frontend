<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
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
  cancel: []
}>()

const { t } = useI18n()

const validationSchema = toTypedSchema(z
  .object({
    currentPassword: z.string().min(1, t('validation.required.currentPassword')),
    newPassword: z.string().min(6, t('validation.passwordMin', { min: '6' })),
    confirmPassword: z.string().min(1, t('validation.required.confirmPassword')),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: t('validation.passwordMismatch'),
  }))

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues>({
  initialValues: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
  validationSchema,
})

const [currentPassword] = defineField('currentPassword')
const [newPassword] = defineField('newPassword')
const [confirmPassword] = defineField('confirmPassword')

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    currentPassword: values.currentPassword,
    newPassword: values.newPassword,
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
    <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" icon="circleCheckBig" :disabled="submitting" block class="sm:w-auto">
        {{ submitting ? t('common.saving') : t('password.change') }}
      </UiButton>
    </div>
  </form>
</template>
