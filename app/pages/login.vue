<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../utils/form'

definePageMeta({
  layout: 'auth',
  public: true,
  title: 'Masuk',
})

const { login } = useAuth()
const toast = useToast()
const { t } = useI18n()
const pending = ref(false)
const loginError = ref('')

const validationSchema = toTypedSchema(z.object({
  username: z.string().min(1, t('login.validation.username')),
  password: z.string().min(1, t('login.validation.password')),
}))

type FormValues = {
  username: string
  password: string
}

const { defineField, errors, handleSubmit } = useForm<FormValues>({
  validationSchema,
  initialValues: {
    username: '',
    password: '',
  },
})

const [username] = defineField('username')
const [password] = defineField('password')

watch([username, password], () => {
  loginError.value = ''
})

const onSubmit = handleSubmit(async (values) => {
  loginError.value = ''
  pending.value = true
  try {
    await login(values)
    toast.success(t('login.success'), t('login.successMessage'))
    await navigateTo('/')
  } catch (error) {
    const mapped = useApi().mapError(error)
    loginError.value = mapped.message
  } finally {
    pending.value = false
  }
})
</script>

<template>
  <GlassCard>
    <div class="mb-8 text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 shadow-[0_20px_40px_rgba(243,95,16,0.22)]">
        <img src="/telurio-logo-2.svg" alt="Telurio" class="h-10 w-10 object-contain" />
      </div>
      <p class="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Telurio</p>
      <h1 class="mt-3 text-3xl font-semibold text-ink-900">{{ t('login.title') }}</h1>
      <p class="mt-3 text-sm text-ink-600">{{ t('login.subtitle') }}</p>
    </div>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <p v-if="loginError" data-field-error="true" class="py-2 text-sm font-medium text-rose-700">
        {{ loginError }}
      </p>
      <UiInput v-model="username" :label="t('login.username')" :error="errors.username" />
      <UiInput v-model="password" :label="t('login.password')" type="password" :error="errors.password" />

      <UiButton block :disabled="pending" type="submit" icon="key">
        {{ pending ? t('login.submitting') : t('login.submit') }}
      </UiButton>
    </form>
  </GlassCard>
</template>
