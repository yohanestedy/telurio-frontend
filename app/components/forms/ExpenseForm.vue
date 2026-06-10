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
  cancel: []
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
  <form class="space-y-5" @submit.prevent="onSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <UiDatePicker
        v-model="date"
        :label="t('common.date')"
        :placeholder="t('date.placeholder')"
        :max="todayIso"
        required
        :error="errors.date"
        :class="isEdit ? 'sm:col-span-2' : ''"
      />
      <UiSelect
        v-if="!isEdit"
        v-model="coopId"
        :options="coopOptions"
        :label="t('common.coop')"
        :placeholder="t('validation.required.coop')"
        required
        :error="errors.coopId"
      />
      <UiSelect
        v-model="expenseCategoryId"
        :options="categoryOptions"
        :label="t('expense.savedCategory')"
        placeholder="Pilih kategori"
        required
        :error="errors.expenseCategoryId"
      />
      <UiInput
        v-model="amount"
        thousand-separator
        prefix="Rp"
        :label="t('common.amount')"
        placeholder="0"
        required
        :error="errors.amount"
      />
    </div>

    <UiInput
      v-model="description"
      :label="t('expense.itemDescription')"
      placeholder="Contoh: Pakan, vitamin, perawatan"
      required
      :error="errors.description"
    />

    <UiTextarea
      v-model="notes"
      :label="t('common.notes')"
      :help="t('expense.optional')"
      :error="errors.notes"
    />

    <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" icon="circleCheckBig" :disabled="submitting" block class="sm:w-auto">
        {{ submitting ? t('common.saving') : t('expense.save') }}
      </UiButton>
    </div>
  </form>
</template>
