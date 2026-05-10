<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

type FormValues = {
  name: string
  isActive: boolean
}

const props = defineProps<{
  initialValue?: Partial<FormValues>
  submitting?: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  submit: [{ name: string; isActive?: boolean }]
}>()

const { t } = useI18n()

const validationSchema = toTypedSchema(z.object({
  name: z.string().min(2, t('validation.categoryNameMin', { min: '2' })),
  isActive: z.boolean().optional(),
}))

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues>({
  initialValues: {
    name: '',
    isActive: true,
  },
})

const [name] = defineField('name')
const [isActive] = defineField('isActive')

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        name: value?.name ?? '',
        isActive: value?.isActive ?? true,
      },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit((values) => {
  emit('submit', values)
})
</script>

<template>
  <form class="grid gap-4" @submit.prevent="onSubmit">
    <UiInput v-model="name" :label="t('expenseCategory.name')" :error="errors.name" />
    <UiCheckbox v-if="isEdit" v-model="isActive" :label="t('expenseCategory.active')" />
    <div class="flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? t('common.saving') : t('expenseCategory.save') }}
      </UiButton>
    </div>
  </form>
</template>
