<script setup lang="ts">
import { z } from 'zod'

const allocationSchema = z.array(
  z.object({
    coopId: z.string().min(1),
    quantityKg: z.coerce.number().min(0.001),
  }),
)

const props = defineProps<{
  coopOptions: Array<{ label: string; value: string }>
  orderQuantityKg: string
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [{ allocations: Array<{ coopId: string; quantityKg: number }> }]
}>()

const values = ref<Record<string, string>>({})
const error = ref('')

const total = computed(() =>
  Object.values(values.value).reduce((sum, item) => sum + (Number(item) || 0), 0),
)

function onSubmit() {
  error.value = ''
  const allocations = Object.entries(values.value)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([coopId, qty]) => ({ coopId, quantityKg: Number(qty) }))

  const parsed = allocationSchema.safeParse(allocations)
  if (!parsed.success) {
    error.value = 'Minimal satu alokasi kandang harus diisi'
    return
  }

  if (Number(total.value.toFixed(3)) !== Number(Number(props.orderQuantityKg).toFixed(3))) {
    error.value = 'Total alokasi harus sama dengan kuantitas order'
    return
  }

  emit('submit', {
    allocations: parsed.data,
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-2xl border border-white/50 bg-white/65 p-4 text-sm text-ink-700">
      Total order: <span class="font-semibold">{{ orderQuantityKg }} kg</span>
      <span class="mx-2">•</span>
      Total alokasi: <span class="font-semibold">{{ total.toFixed(3) }} kg</span>
    </div>
    <div class="grid gap-3">
      <label
        v-for="coop in coopOptions"
        :key="coop.value"
        class="flex items-center justify-between gap-4 rounded-2xl border border-white/40 bg-white/70 p-4"
      >
        <span class="text-sm font-medium text-ink-800">{{ coop.label }}</span>
        <input
          v-model="values[coop.value]"
          type="number"
          step="0.001"
          min="0"
          class="field-shell max-w-[160px]"
          placeholder="0.000"
        >
      </label>
    </div>
    <p v-if="error" class="text-sm font-medium text-rose-600">{{ error }}</p>
    <div class="flex justify-end">
      <UiButton :disabled="submitting" @click="onSubmit">
        {{ submitting ? 'Menyimpan...' : 'Mulai pengantaran' }}
      </UiButton>
    </div>
  </div>
</template>
