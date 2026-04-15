<script setup lang="ts">
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
const pending = ref(false)

const schema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type FormValues = {
  username: string
  password: string
}

const { defineField, errors, handleSubmit, setErrors } = useForm<FormValues>({
  initialValues: {
    username: '',
    password: '',
  },
})

const [username] = defineField('username')
const [password] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  pending.value = true
  try {
    await login(parsed.data)
    toast.success('Login berhasil', 'Selamat datang kembali di Telurio')
    await navigateTo('/')
  } catch (error) {
    const mapped = useApi().mapError(error)
    toast.error('Login gagal', mapped.message)
  } finally {
    pending.value = false
  }
})
</script>

<template>
  <GlassCard>
    <div class="mb-8 text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-white shadow-[0_20px_40px_rgba(243,95,16,0.22)]">
        <UiIcon name="profile" class="h-7 w-7" />
      </div>
      <p class="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Telurio</p>
      <h1 class="mt-3 text-3xl font-semibold text-ink-900">Egg Farm Management</h1>
      <p class="mt-3 text-sm text-ink-600">
        Masuk untuk mengelola order, produksi, pengeluaran, dan laporan kandang.
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <UiInput v-model="username" label="Username" :error="errors.username" />
      <UiInput v-model="password" label="Password" type="password" :error="errors.password" />
      <UiButton block :disabled="pending" type="submit" icon="key">
        {{ pending ? 'Memproses...' : 'Masuk' }}
      </UiButton>
    </form>
  </GlassCard>
</template>
