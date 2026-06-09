<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import dayjs from 'dayjs'

type FormValues = {
  date: string
  coopId: string
  expenseCategoryId: string
  // categoryLabel removed
  description: string
  amount: string
  notes: string
}

type SubmitValues = {
  date: string
  coopId: string
  expenseCategoryId?: string
  description: string
  amount: number
  notes?: string
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

const todayIso = dayjs().format('YYYY-MM-DD')

const validationSchema = toTypedSchema(z.object({
  date: z.string().min(1, t('validation.required.date')),
  coopId: z.string().min(1, t('validation.required.coop')),
  expenseCategoryId: z.string().min(1, 'Kategori wajib dipilih'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  amount: z.coerce.number().min(500, 'Nominal minimal Rp 500'),
  notes: z.string().optional(),
}))

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues, SubmitValues>({
  validationSchema,
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
  emit('submit', {
    date: values.date,
    ...(props.isEdit ? {} : {
      coopId: values.coopId,
    }),
    expenseCategoryId: values.expenseCategoryId || null,
    // categoryLabel removed
    description: values.description,
    amount: values.amount,
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
      placeholder="Pilih kategori"
      :error="errors.expenseCategoryId"
    />
    <!-- categoryLabel removed -->
    <UiInput v-model="amount" type="number" min="500" step="1" :label="t('common.amount')" :error="errors.amount" />
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
