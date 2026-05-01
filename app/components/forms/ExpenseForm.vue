<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

type FormValues = {
  date: string
  coopId: string
  expenseCategoryId: string
  // categoryLabel removed
  description: string
  amount: string
  notes: string
}

const props = defineProps<{
  coopOptions: Array<{ label: string; value: string }>
  categoryOptions: Array<{ label: string; value: string }>
  initialValue?: Partial<FormValues>
  submitting?: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  submit: [
    {
      date?: string
      coopId?: string
      expenseCategoryId?: string | null
      // categoryLabel removed
      description?: string
      amount: number
      notes?: string
    },
  ]
}>()

const { t } = useI18n()

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
  initialValues: {
    date: '',
    coopId: '',
    expenseCategoryId: '',
    // categoryLabel removed
    description: '',
    amount: '',
    notes: '',
  },
})

const [date] = defineField('date')
const [coopId] = defineField('coopId')
const [expenseCategoryId] = defineField('expenseCategoryId')
// categoryLabel removed
const [description] = defineField('description')
const [amount] = defineField('amount')
const [notes] = defineField('notes')

function getAutoSelectedCoopId() {
  if (props.isEdit) {
    return ''
  }

  if (props.coopOptions.length !== 1) {
    return ''
  }

  return props.coopOptions[0]?.value ?? ''
}

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        date: value?.date ?? '',
        coopId: value?.coopId ?? getAutoSelectedCoopId(),
        expenseCategoryId: value?.expenseCategoryId ?? '',
        // categoryLabel removed
        description: value?.description ?? '',
        amount: value?.amount ?? '',
        notes: value?.notes ?? '',
      },
    })
  },
  { immediate: true },
)

watch(
  () => props.coopOptions,
  (nextOptions) => {
    if (props.isEdit || coopId.value || nextOptions.length !== 1) {
      return
    }

    coopId.value = nextOptions[0]?.value ?? ''
  },
)

watch(expenseCategoryId, (value) => {
  if (!value) {
    return
  }
  const selected = props.categoryOptions.find((item) => item.value === value)
  // categoryLabel removed
})

const onSubmit = handleSubmit((values) => {
  const schema = z.object({
    date: z.string().min(1, t('validation.required.date')),
    coopId: z.string().min(1, t('validation.required.coop')),
    expenseCategoryId: z.string().optional(),
    description: z.string().optional(),
    amount: z.coerce.number().min(0, t('validation.min.zero')),
    notes: z.string().optional(),
  })
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  emit('submit', {
    date: parsed.data.date,
    ...(props.isEdit ? {} : {
      coopId: parsed.data.coopId,
    }),
    expenseCategoryId: parsed.data.expenseCategoryId || null,
    // categoryLabel removed
    description: parsed.data.description || undefined,
    amount: parsed.data.amount,
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
      v-if="!isEdit"
      v-model="coopId"
      :options="coopOptions"
      :label="t('common.coop')"
      :placeholder="t('validation.required.coop')"
      :error="errors.coopId"
    />
    <UiSelect
      v-model="expenseCategoryId"
      :options="categoryOptions"
      :label="t('expense.savedCategory')"
      :placeholder="t('expense.optional')"
      :error="errors.expenseCategoryId"
    />
    <!-- categoryLabel removed -->
    <UiInput v-model="amount" type="number" :label="t('common.amount')" :error="errors.amount" />
    <UiInput v-model="description" :label="t('expense.itemDescription')" :error="errors.description" />
    <div class="md:col-span-2">
      <UiTextarea v-model="notes" :label="t('common.notes')" :error="errors.notes" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? t('common.saving') : t('expense.save') }}
      </UiButton>
    </div>
  </form>
</template>
