<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

const schema = z.object({
  name: z.string().min(2, 'Nama kandang minimal 2 karakter'),
  population: z.coerce.number().int().min(1, 'Populasi minimal 1'),
  chickenStrain: z.string().optional(),
  chickBirthDate: z.string().optional(),
  depreciationPercent: z.coerce
    .number()
    .min(0, 'Minimal 0')
    .max(100, 'Maksimal 100'),
  isActive: z.boolean().optional(),
})

type FormValues = {
  name: string
  population: string
  chickenStrain: string
  chickBirthDate: string
  depreciationPercent: string
  isActive: boolean
}

const props = defineProps<{
  initialValue?: Partial<FormValues>
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [
    {
      name: string
      population: number
      chickenStrain?: string
      chickBirthDate?: string
      depreciationPercent: number
      isActive?: boolean
    },
  ]
}>()

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
  initialValues: {
    name: '',
    population: '',
    chickenStrain: '',
    chickBirthDate: '',
    depreciationPercent: '15',
    isActive: true,
  },
})

const [name] = defineField('name')
const [population] = defineField('population')
const [chickenStrain] = defineField('chickenStrain')
const [chickBirthDate] = defineField('chickBirthDate')
const [depreciationPercent] = defineField('depreciationPercent')
const [isActive] = defineField('isActive')

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        name: value?.name ?? '',
        population: value?.population ?? '',
        chickenStrain: value?.chickenStrain ?? '',
        chickBirthDate: value?.chickBirthDate ?? '',
        depreciationPercent: value?.depreciationPercent ?? '15',
        isActive: value?.isActive ?? true,
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
    ...parsed.data,
    chickenStrain: parsed.data.chickenStrain || undefined,
    chickBirthDate: parsed.data.chickBirthDate || undefined,
  })
})
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <UiInput v-model="name" label="Nama kandang" :error="errors.name" />
    <UiInput v-model="population" label="Populasi aktif" type="number" :error="errors.population" />
    <UiInput v-model="chickenStrain" label="Strain ayam" :error="errors.chickenStrain" />
    <UiInput v-model="chickBirthDate" label="Tanggal menetas" type="date" :error="errors.chickBirthDate" />
    <UiInput
      v-model="depreciationPercent"
      label="Persentase penyusutan"
      type="number"
      :error="errors.depreciationPercent"
    />
    <div class="md:col-span-2">
      <UiCheckbox v-model="isActive" label="Kandang aktif" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? 'Menyimpan...' : 'Simpan kandang' }}
      </UiButton>
    </div>
  </form>
</template>
