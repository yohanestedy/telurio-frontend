<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'

type FormValues = {
  name: string
  population: string
  chickenStrain: string
  chickBirthDate: string
  depreciationPercent: string
  isActive: boolean
}

type SubmitValues = {
  name: string
  population: number
  chickenStrain?: string
  chickBirthDate?: string
  depreciationPercent: number
  isActive?: boolean
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

const { t } = useI18n()

const validationSchema = toTypedSchema(z.object({
  name: z.string().min(2, t('validation.coopNameMin', { min: '2' })),
  population: z.coerce.number().int().min(1, t('validation.min.population')),
  chickenStrain: z.string().optional(),
  chickBirthDate: z.string().optional(),
  depreciationPercent: z.coerce
    .number()
    .min(0, t('validation.min.zero'))
    .max(100, t('validation.max.percent')),
  isActive: z.boolean().optional(),
}))

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues, SubmitValues>({
  validationSchema,
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
  emit('submit', {
    ...values,
    chickenStrain: values.chickenStrain || undefined,
    chickBirthDate: values.chickBirthDate || undefined,
  })
})
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <UiInput v-model="name" :label="t('form.coop.name')" :error="errors.name" />
    <UiInput v-model="population" :label="t('form.coop.activePopulation')" type="number" :error="errors.population" />
    <UiInput v-model="chickenStrain" :label="t('form.coop.chickenStrain')" :error="errors.chickenStrain" />
    <UiDatePicker
      v-model="chickBirthDate"
      :label="t('form.coop.hatchDate')"
      :placeholder="t('form.coop.pickHatchDate')"
      :error="errors.chickBirthDate"
    />
    <UiInput
      v-model="depreciationPercent"
      :label="t('form.coop.depreciationPercent')"
      type="number"
      :error="errors.depreciationPercent"
    />
    <div class="md:col-span-2">
      <UiCheckbox v-model="isActive" :label="t('form.coop.active')" />
    </div>
    <div class="md:col-span-2 flex justify-end">
      <UiButton :disabled="submitting" type="submit">
        {{ submitting ? t('common.saving') : t('form.coop.save') }}
      </UiButton>
    </div>
  </form>
</template>
