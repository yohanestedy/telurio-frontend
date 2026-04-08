<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

const schema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  coopId: z.string().min(1, 'Kandang wajib dipilih'),
  collectionTime: z.string().min(1, 'Waktu pengambilan wajib diisi'),
  goodKg: z.coerce.number().min(0, 'Minimal 0'),
  goodCount: z.coerce.number().int().min(0, 'Minimal 0'),
  brokenCount: z.coerce.number().int().min(0, 'Minimal 0').optional(),
  notes: z.string().optional(),
})

type FormValues = {
  date: string
  coopId: string
  collectionTime: string
  goodKg: string
  goodCount: string
  brokenCount: string
  notes: string
}

const props = defineProps<{
  coopOptions: Array<{ label: string; value: string }>
  initialValue?: Partial<FormValues>
  submitting?: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  submit: [
    {
      date?: string
      coopId?: string
      collectionTime?: string
      goodKg: number
      goodCount: number
      brokenCount?: number
      notes?: string
    },
  ]
}>()

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
  initialValues: {
    date: '',
    coopId: '',
    collectionTime: '',
    goodKg: '',
    goodCount: '',
    brokenCount: '',
    notes: '',
  },
})

const [date] = defineField('date')
const [coopId] = defineField('coopId')
const [collectionTime] = defineField('collectionTime')
const [goodKg] = defineField('goodKg')
const [goodCount] = defineField('goodCount')
const [brokenCount] = defineField('brokenCount')
const [notes] = defineField('notes')

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        date: value?.date ?? '',
        coopId: value?.coopId ?? '',
        collectionTime: value?.collectionTime ?? '',
        goodKg: value?.goodKg ?? '',
        goodCount: value?.goodCount ?? '',
        brokenCount: value?.brokenCount ?? '',
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
    ...(props.isEdit ? {} : {
      date: parsed.data.date,
      coopId: parsed.data.coopId,
      collectionTime: parsed.data.collectionTime,
    }),
    goodKg: parsed.data.goodKg,
    goodCount: parsed.data.goodCount,
    brokenCount: values.brokenCount ? parsed.data.brokenCount : undefined,
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
    <UiInput
      v-if="!isEdit"
      v-model="collectionTime"
      label="Waktu pengambilan"
      placeholder="07:00"
      :error="errors.collectionTime"
    />
    <UiInput v-model="goodKg" type="number" label="Berat bagus (kg)" :error="errors.goodKg" />
    <UiInput v-model="goodCount" type="number" label="Jumlah bagus" :error="errors.goodCount" />
    <UiInput v-model="brokenCount" type="number" label="Jumlah pecah" :error="errors.brokenCount" />
    <div class="md:col-span-2">
      <UiTextarea v-model="notes" label="Catatan" :error="errors.notes" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? 'Menyimpan...' : 'Simpan produksi' }}
      </UiButton>
    </div>
  </form>
</template>
