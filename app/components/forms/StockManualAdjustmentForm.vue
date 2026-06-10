<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'

type FormValues = {
  coopId: string
  direction: 'IN' | 'OUT'
  quantityKg: string
  notes: string
}

type SubmitValues = {
  coopId: string
  direction: 'IN' | 'OUT'
  quantityKg: number
  notes: string
}

const props = withDefaults(defineProps<{
  coopOptions: Array<{ label: string; value: string }>
  submitting?: boolean
}>(), {
  submitting: false,
})

const emit = defineEmits<{
  submit: [
    {
      coopId: string
      direction: 'IN' | 'OUT'
      quantityKg: number
      notes: string
    },
  ]
  cancel: []
}>()

const { t } = useI18n()

const validationSchema = toTypedSchema(z.object({
  coopId: z.string().min(1, t('validation.required.coop')),
  direction: z.enum(['IN', 'OUT']),
  quantityKg: z.coerce.number().min(0.01, t('validation.min.quantityKg', { min: '0.01' })),
  notes: z.string().trim().min(1, t('validation.required.notes')).max(255, t('validation.max.characters', { max: '255' })),
}))

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues, SubmitValues>({
  validationSchema,
  initialValues: {
    coopId: '',
    direction: 'IN',
    quantityKg: '',
    notes: '',
  },
})

const [coopId] = defineField('coopId')
const [direction] = defineField('direction')
const [quantityKg] = defineField('quantityKg')
const [notes] = defineField('notes')

function resetIfSingleCoop() {
  if (props.coopOptions.length !== 1) {
    return
  }

  coopId.value = props.coopOptions[0]?.value ?? ''
}

watch(
  () => props.coopOptions,
  () => {
    resetIfSingleCoop()
  },
  { immediate: true },
)

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    coopId: values.coopId,
    direction: values.direction,
    quantityKg: values.quantityKg,
    notes: values.notes,
  })
})

function onReset() {
  resetForm({
    values: {
      coopId: props.coopOptions.length === 1 ? props.coopOptions[0]?.value ?? '' : '',
      direction: 'IN',
      quantityKg: '',
      notes: '',
    },
  })
}
</script>

<template>
  <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
    <UiSelect
      v-model="coopId"
      :options="coopOptions"
      :label="t('common.coop')"
      :placeholder="t('validation.required.coop')"
      required
      :error="errors.coopId"
    />

    <div class="space-y-1.5">
      <p class="text-sm font-medium text-ink-800">{{ t('stock.adjustmentDirection') }}</p>
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="rounded-xl border px-3 py-2 text-sm font-medium transition"
          :class="direction === 'IN'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-white/60 bg-white/70 text-ink-700 hover:bg-white'"
          @click="direction = 'IN'"
        >
          {{ t('stock.in') }} (+)
        </button>
        <button
          type="button"
          class="rounded-xl border px-3 py-2 text-sm font-medium transition"
          :class="direction === 'OUT'
            ? 'border-rose-300 bg-rose-50 text-rose-700'
            : 'border-white/60 bg-white/70 text-ink-700 hover:bg-white'"
          @click="direction = 'OUT'"
        >
          {{ t('stock.out') }} (-)
        </button>
      </div>
    </div>

    <UiInput
      v-model="quantityKg"
      type="number"
      min="0"
      step="0.01"
      :label="t('order.quantity') + ' (kg)'"
      placeholder="0.00"
      required
      :error="errors.quantityKg"
    />

    <div class="md:col-span-2">
      <UiTextarea
        v-model="notes"
        :label="t('common.notes')"
        :placeholder="t('stock.notesPlaceholder')"
        :rows="3"
        :error="errors.notes"
      />
    </div>

    <div class="md:col-span-2 flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" :disabled="submitting" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" icon="circleCheckBig" :disabled="submitting" block class="sm:w-auto">
        {{ submitting ? t('common.saving') : t('stock.saveAdjustment') }}
      </UiButton>
    </div>
  </form>
</template>
