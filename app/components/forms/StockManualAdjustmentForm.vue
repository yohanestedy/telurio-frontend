<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

const schema = z.object({
  coopId: z.string().min(1, 'Kandang wajib dipilih'),
  direction: z.enum(['IN', 'OUT']),
  quantityKg: z.coerce.number().min(0.001, 'Jumlah minimal 0.001 kg'),
  notes: z.string().max(255, 'Maksimal 255 karakter').optional(),
})

type FormValues = {
  coopId: string
  direction: 'IN' | 'OUT'
  quantityKg: string
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
      notes?: string
    },
  ]
}>()

const { defineField, errors, handleSubmit, setErrors, resetForm } = useForm<FormValues>({
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
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  emit('submit', {
    coopId: parsed.data.coopId,
    direction: parsed.data.direction,
    quantityKg: parsed.data.quantityKg,
    notes: parsed.data.notes?.trim() || undefined,
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
      label="Kandang"
      placeholder="Pilih kandang"
      :error="errors.coopId"
    />

    <div class="space-y-1.5">
      <p class="text-sm font-medium text-ink-800">Arah penyesuaian</p>
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="rounded-xl border px-3 py-2 text-sm font-medium transition"
          :class="direction === 'IN'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-white/60 bg-white/70 text-ink-700 hover:bg-white'"
          @click="direction = 'IN'"
        >
          Masuk (+)
        </button>
        <button
          type="button"
          class="rounded-xl border px-3 py-2 text-sm font-medium transition"
          :class="direction === 'OUT'
            ? 'border-rose-300 bg-rose-50 text-rose-700'
            : 'border-white/60 bg-white/70 text-ink-700 hover:bg-white'"
          @click="direction = 'OUT'"
        >
          Keluar (-)
        </button>
      </div>
    </div>

    <UiInput
      v-model="quantityKg"
      type="number"
      min="0"
      step="0.001"
      label="Jumlah (kg)"
      placeholder="0.00"
      :error="errors.quantityKg"
    />

    <div class="md:col-span-2">
      <UiTextarea
        v-model="notes"
        label="Catatan"
        placeholder="Alasan penyesuaian stok..."
        :rows="3"
        :error="errors.notes"
      />
    </div>

    <div class="md:col-span-2 flex justify-end gap-2">
      <UiButton type="button" variant="ghost" :disabled="submitting" @click="onReset">
        Reset
      </UiButton>
      <UiButton type="submit" :disabled="submitting">
        {{ submitting ? 'Menyimpan...' : 'Simpan penyesuaian' }}
      </UiButton>
    </div>
  </form>
</template>
