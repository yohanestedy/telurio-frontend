<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

const schema = z.object({
  effectiveDate: z.string().min(1, 'Tanggal wajib diisi'),
  pricePerKg: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  notes: z.string().optional(),
})

type FormValues = {
  effectiveDate: string
  pricePerKg: string
  notes: string
}

const props = defineProps<{
  initialValue?: Partial<FormValues>
  submitting?: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  submit: [{ effectiveDate?: string; pricePerKg: number; notes?: string }]
}>()

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
  initialValues: {
    effectiveDate: '',
    pricePerKg: '',
    notes: '',
  },
})

const [effectiveDate] = defineField('effectiveDate')
const [pricePerKg] = defineField('pricePerKg')
const [notes] = defineField('notes')

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        effectiveDate: value?.effectiveDate ?? '',
        pricePerKg: value?.pricePerKg ?? '',
        notes: value?.notes ?? '',
      },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit((values) => {
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  emit('submit', {
    effectiveDate: props.isEdit ? undefined : parsed.data.effectiveDate,
    pricePerKg: parsed.data.pricePerKg,
    notes: parsed.data.notes || undefined,
  })
})
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <UiInput
      v-if="!isEdit"
      v-model="effectiveDate"
      label="Tanggal efektif"
      type="date"
      :error="errors.effectiveDate"
    />
    <UiInput v-model="pricePerKg" label="Harga per kg" type="number" :error="errors.pricePerKg" />
    <div :class="{ 'md:col-span-2': !isEdit }">
      <UiTextarea v-model="notes" label="Catatan" :error="errors.notes" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? 'Menyimpan...' : 'Simpan harga' }}
      </UiButton>
    </div>
  </form>
</template>
