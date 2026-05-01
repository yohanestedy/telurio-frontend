<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

type FormValues = {
  name: string
  address: string
  phone: string
}

const props = defineProps<{
  initialValue?: Partial<FormValues>
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [{ name: string; address?: string; phone?: string }]
}>()

const { t } = useI18n()

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
  initialValues: {
    name: '',
    address: '',
    phone: '',
  },
})

const [name] = defineField('name')
const [address] = defineField('address')
const [phone] = defineField('phone')

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        name: value?.name ?? '',
        address: value?.address ?? '',
        phone: value?.phone ?? '',
      },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit((values) => {
  const schema = z.object({
    name: z.string().min(2, t('validation.nameMin', { min: '2' })),
    address: z.string().optional(),
    phone: z.string().optional(),
  })
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  emit('submit', {
    name: parsed.data.name,
    address: parsed.data.address || undefined,
    phone: parsed.data.phone || undefined,
  })
})
</script>

<template>
  <form class="grid gap-4" @submit.prevent="onSubmit">
    <UiInput v-model="name" :label="t('form.customer.name')" :error="errors.name" />
    <UiInput v-model="phone" :label="t('form.customer.phone')" :error="errors.phone" />
    <UiTextarea v-model="address" :label="t('common.address')" :error="errors.address" />
    <div class="flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? t('common.saving') : t('form.customer.save') }}
      </UiButton>
    </div>
  </form>
</template>
