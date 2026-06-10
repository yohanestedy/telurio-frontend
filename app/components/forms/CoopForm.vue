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
  cancel: []
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
  <form class="space-y-5" @submit.prevent="onSubmit">
    <div class="grid gap-4 sm:grid-cols-2">
      <UiInput v-model="name" :label="t('form.coop.name')" required :error="errors.name" />
      <UiInput
        v-model="population"
        :label="t('form.coop.activePopulation')"
        type="number"
        min="1"
        inputmode="numeric"
        required
        :error="errors.population"
      />
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
        min="0"
        max="100"
        inputmode="decimal"
        required
        :error="errors.depreciationPercent"
      />
    </div>
    <UiCheckbox v-model="isActive" :label="t('form.coop.active')" />
    <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" icon="circleCheckBig" :disabled="submitting" block class="sm:w-auto">
        {{ submitting ? t('common.saving') : t('form.coop.save') }}
      </UiButton>
    </div>
  </form>
</template>
