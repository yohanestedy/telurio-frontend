<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

const schema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  coopId: z.string().min(1, 'Kandang wajib dipilih'),
  expenseCategoryId: z.string().optional(),
  categoryLabel: z.string().min(2, 'Label kategori minimal 2 karakter'),
  description: z.string().optional(),
  amount: z.coerce.number().min(0, 'Jumlah tidak boleh negatif'),
  notes: z.string().optional(),
})

type FormValues = {
  date: string
  coopId: string
  expenseCategoryId: string
  categoryLabel: string
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
      categoryLabel: string
      description?: string
      amount: number
      notes?: string
    },
  ]
}>()

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
  initialValues: {
    date: '',
    coopId: '',
    expenseCategoryId: '',
    categoryLabel: '',
    description: '',
    amount: '',
    notes: '',
  },
})

const [date] = defineField('date')
const [coopId] = defineField('coopId')
const [expenseCategoryId] = defineField('expenseCategoryId')
const [categoryLabel] = defineField('categoryLabel')
const [description] = defineField('description')
const [amount] = defineField('amount')
const [notes] = defineField('notes')

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        date: value?.date ?? '',
        coopId: value?.coopId ?? '',
        expenseCategoryId: value?.expenseCategoryId ?? '',
        categoryLabel: value?.categoryLabel ?? '',
        description: value?.description ?? '',
        amount: value?.amount ?? '',
        notes: value?.notes ?? '',
      },
    })
  },
  { immediate: true },
)

watch(expenseCategoryId, (value) => {
  if (!value) {
    return
  }
  const selected = props.categoryOptions.find((item) => item.value === value)
  if (selected) {
    categoryLabel.value = selected.label
  }
})

const onSubmit = handleSubmit((values) => {
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  emit('submit', {
    ...(props.isEdit ? {} : {
      date: parsed.data.date,
      coopId: parsed.data.coopId,
    }),
    expenseCategoryId: parsed.data.expenseCategoryId || null,
    categoryLabel: parsed.data.categoryLabel,
    description: parsed.data.description || undefined,
    amount: parsed.data.amount,
    notes: parsed.data.notes || undefined,
  })
})
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <UiInput v-if="!isEdit" v-model="date" type="date" label="Tanggal" :error="errors.date" />
    <UiSelect
      v-if="!isEdit"
      v-model="coopId"
      :options="coopOptions"
      label="Kandang"
      placeholder="Pilih kandang"
      :error="errors.coopId"
    />
    <UiSelect
      v-model="expenseCategoryId"
      :options="categoryOptions"
      label="Kategori tersimpan"
      placeholder="Opsional"
      :error="errors.expenseCategoryId"
    />
    <UiInput v-model="categoryLabel" label="Label kategori" :error="errors.categoryLabel" />
    <UiInput v-model="amount" type="number" label="Jumlah" :error="errors.amount" />
    <UiInput v-model="description" label="Deskripsi" :error="errors.description" />
    <div class="md:col-span-2">
      <UiTextarea v-model="notes" label="Catatan" :error="errors.notes" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? 'Menyimpan...' : 'Simpan pengeluaran' }}
      </UiButton>
    </div>
  </form>
</template>
