<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
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
  cancel: []
}>()

const { t } = useI18n()

const validationSchema = toTypedSchema(z.object({
  name: z.string().min(2, t('validation.nameMin', { min: '2' })),
  address: z.string().optional(),
  phone: z.string().optional(),
}))

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
  initialValues: {
    name: '',
    address: '',
    phone: '',
  },
  validationSchema,
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
  emit('submit', {
    name: values.name,
    address: values.address || undefined,
    phone: values.phone || undefined,
  })
})
</script>

<template>
  <form class="space-y-5" @submit.prevent="onSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <UiInput v-model="name" :label="t('form.customer.name')" required :error="errors.name" />
      <UiInput v-model="phone" :label="t('form.customer.phone')" type="tel" inputmode="tel" :error="errors.phone" />
    </div>
    <UiTextarea v-model="address" :label="t('common.address')" :help="t('expense.optional')" :error="errors.address" />
    <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" icon="circleCheckBig" :disabled="submitting" block class="sm:w-auto">
        {{ submitting ? t('common.saving') : t('form.customer.save') }}
      </UiButton>
    </div>
  </form>
</template>
