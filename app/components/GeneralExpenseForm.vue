<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../utils/form'
import type { GeneralExpenseCategoryItem, GeneralExpenseItem } from '../types/domain'

type FormValues = {
  date: string
  description: string
  amount: string
  categoryId: string
  notes: string
}

const props = defineProps<{
  initial: GeneralExpenseItem | null
  categories: GeneralExpenseCategoryItem[]
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [payload: Record<string, unknown>]
  cancel: []
}>()

const { t } = useI18n()

const categoryOptions = computed(() =>
  props.categories.map((c) => ({ label: c.name, value: c.id })),
)

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
  initialValues: {
    date: '',
    description: '',
    amount: '',
    categoryId: '',
    notes: '',
  },
})

const [date] = defineField('date')
const [description] = defineField('description')
const [amount] = defineField('amount')
const [categoryId] = defineField('categoryId')
const [notes] = defineField('notes')

watch(
  () => JSON.stringify(props.initial),
  () => {
    const value = props.initial
    resetForm({
      values: {
        date: value?.date?.slice(0, 10) ?? '',
        description: value?.description ?? '',
        amount: value?.amount ? String(Number(value.amount)) : '',
        categoryId: value?.categoryId ?? '',
        notes: value?.notes ?? '',
      },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit((values) => {
  const schema = z.object({
    date: z.string().min(1, t('validation.required.date')),
    description: z.string().min(1, t('validation.required.description')),
    amount: z.coerce.number().min(1, t('validation.min.one')),
    categoryId: z.string().optional(),
    notes: z.string().optional(),
  })

  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  emit('submit', {
    date: parsed.data.date,
    description: parsed.data.description,
    amount: parsed.data.amount,
    categoryId: parsed.data.categoryId || null,
    notes: parsed.data.notes || undefined,
  })
})
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <UiDatePicker
      v-model="date"
      :label="t('common.date')"
      :placeholder="t('date.placeholder')"
      :error="errors.date"
    />
    <UiSelect
      v-model="categoryId"
      :options="categoryOptions"
      :label="t('expense.category')"
      :placeholder="t('expense.optional')"
      :error="errors.categoryId"
    />
    <UiInput v-model="amount" type="number" :label="t('common.amount')" :error="errors.amount" />
    <UiInput v-model="description" :label="t('expense.itemDescription')" :placeholder="t('generalExpense.descriptionPlaceholder')" :error="errors.description" />
    <div class="md:col-span-2">
      <UiTextarea v-model="notes" :label="t('common.notes')" :error="errors.notes" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? t('common.saving') : t('common.save') }}
      </UiButton>
    </div>
  </form>
</template>
