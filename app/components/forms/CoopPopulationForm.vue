<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import type { CoopItem } from '../../types/domain'

type FormValues = {
  population: string
  populationChangeReason: string
}

type SubmitValues = {
  population: number
  populationChangeReason?: string
}

const validationSchema = toTypedSchema(z.object({
  population: z.coerce.number().int().min(1, 'Populasi minimal 1'),
  populationChangeReason: z.string().max(255, 'Maksimal 255 karakter').optional(),
}))

const props = defineProps<{
  coop: CoopItem
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [
    {
      population: number
      populationChangeReason?: string
    },
  ]
}>()

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues, SubmitValues>({
  validationSchema,
  initialValues: {
    population: '',
    populationChangeReason: '',
  },
})

const [population] = defineField('population')
const [populationChangeReason] = defineField('populationChangeReason')

const nextPopulation = computed(() => Number(population.value))
const deltaPopulation = computed(() => {
  if (!Number.isFinite(nextPopulation.value)) {
    return null
  }

  return nextPopulation.value - props.coop.population
})

watch(
  () => props.coop.id,
  () => {
    resetForm({
      values: {
        population: String(props.coop.population),
        populationChangeReason: '',
      },
    })
  },
  { immediate: true },
)

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    population: values.population,
    populationChangeReason: values.populationChangeReason?.trim() || undefined,
  })
})
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div class="rounded-2xl border border-slate-200/80 bg-white/65 p-3 text-sm">
      <p class="font-semibold text-ink-900">{{ props.coop.name }}</p>
      <p class="mt-1 text-xs text-ink-500">
        Populasi saat ini {{ props.coop.population.toLocaleString('id-ID') }} ekor
      </p>
    </div>

    <UiInput
      v-model="population"
      label="Populasi aktif terbaru"
      type="number"
      min="1"
      inputmode="numeric"
      :error="errors.population"
    />

    <div
      v-if="deltaPopulation !== null"
      class="rounded-2xl border border-slate-200/80 bg-white/60 px-3 py-2 text-xs text-ink-600"
    >
      Selisih:
      <span
        class="font-semibold"
        :class="deltaPopulation >= 0 ? 'text-emerald-700' : 'text-rose-600'"
      >
        {{ deltaPopulation > 0 ? '+' : '' }}{{ deltaPopulation.toLocaleString('id-ID') }} ekor
      </span>
    </div>

    <UiTextarea
      v-model="populationChangeReason"
      label="Catatan perubahan"
      placeholder="Opsional, misal afkir, mati, koreksi hitung..."
      :rows="3"
      :error="errors.populationChangeReason"
    />

    <div class="flex justify-end gap-2">
      <UiButton type="submit" :disabled="submitting">
        {{ submitting ? 'Menyimpan...' : 'Simpan populasi' }}
      </UiButton>
    </div>
  </form>
</template>
