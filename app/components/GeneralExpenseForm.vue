<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import dayjs from 'dayjs'
import type { GeneralExpenseCategoryItem, GeneralExpenseItem } from '../types/domain'

type FormValues = {
  date: string
  description: string
  amount: string
  categoryId: string
  notes: string
}

type SubmitValues = {
  date: string
  description: string
  amount: number
  categoryId?: string
  notes?: string
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

const todayIso = dayjs().format('YYYY-MM-DD')

const validationSchema = toTypedSchema(z.object({
  date: z.string().min(1, t('validation.required.date')),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  amount: z.coerce.number().min(500, 'Nominal minimal Rp 500'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  notes: z.string().optional(),
}))

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues, SubmitValues>({
  validationSchema,
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
  emit('submit', {
    date: values.date,
    description: values.description,
    amount: values.amount,
    categoryId: values.categoryId || null,
    notes: values.notes || undefined,
  })
})
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <UiDatePicker
      v-model="date"
      :label="t('common.date')"
      :placeholder="t('date.placeholder')"
      :max="todayIso"
      :error="errors.date"
    />
    <UiSelect
      v-model="categoryId"
      :options="categoryOptions"
      :label="t('expense.category')"
      placeholder="Pilih kategori"
      :error="errors.categoryId"
    />
    <UiInput v-model="amount" type="number" min="500" step="1" :label="t('common.amount')" :error="errors.amount" />
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
