<script setup lang="ts">
import type { PriceItem } from '../types/domain'

definePageMeta({
  title: 'Daily Prices',
  roles: ['ADMIN'],
})

const api = useApi()
const toast = useToast()
const pagination = usePagination()

const loading = ref(true)
const error = ref('')
const currentPrice = ref<PriceItem | null>(null)
const prices = ref<PriceItem[]>([])
const dialogOpen = ref(false)
const editing = ref<PriceItem | null>(null)
const submitting = ref(false)

async function loadPrices() {
  loading.value = true
  error.value = ''
  try {
    const [current, list] = await Promise.all([
      api.get<PriceItem>('/prices/current'),
      api.getPage<PriceItem[]>('/prices', pagination.query.value),
    ])
    currentPrice.value = current
    prices.value = list.data
    pagination.applyMeta(list.meta)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function submitPrice(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/prices/${editing.value.id}`, payload)
      toast.success('Harga berhasil diperbarui')
    } else {
      await api.post('/prices', payload)
      toast.success('Harga berhasil dibuat')
    }
    dialogOpen.value = false
    editing.value = null
    await loadPrices()
  } catch (caught) {
    toast.error('Gagal menyimpan harga', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

onMounted(loadPrices)
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-4 md:grid-cols-[1fr_auto]">
      <MetricCard
        label="Harga aktif"
        :value="currentPrice ? formatRupiah(currentPrice.pricePerKg) : '-'"
        :helper="currentPrice ? formatDate(currentPrice.effectiveDate) : 'Belum ada harga aktif'"
      />
      <div class="flex items-end gap-2">
        <UiButton variant="secondary" @click="loadPrices">Refresh</UiButton>
        <UiButton @click="dialogOpen = true; editing = null">Tambah harga</UiButton>
      </div>
    </div>

    <LoadingSkeleton v-if="loading" :lines="7" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton @click="loadPrices">Coba lagi</UiButton>
    </ErrorState>
    <TableCard v-else title="Riwayat Harga Harian" description="Harga per kg yang menjadi source of truth untuk order.">
      <table class="min-w-full text-left text-sm">
        <thead class="text-ink-500">
          <tr>
            <th class="pb-3 pr-4">Tanggal</th>
            <th class="pb-3 pr-4">Harga</th>
            <th class="pb-3 pr-4">Catatan</th>
            <th class="pb-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="price in prices" :key="price.id" class="border-t border-white/40">
            <td class="py-4 pr-4">{{ formatDate(price.effectiveDate) }}</td>
            <td class="py-4 pr-4 font-medium text-ink-900">{{ formatRupiah(price.pricePerKg) }}</td>
            <td class="py-4 pr-4">{{ price.notes || '-' }}</td>
            <td class="py-4 text-right">
              <UiButton variant="ghost" size="sm" @click="dialogOpen = true; editing = price">
                Edit
              </UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </TableCard>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit harga' : 'Tambah harga baru'"
      description="Harga akan dipakai saat order dibayar lunas atau delivery dimulai."
    >
      <PriceForm
        :is-edit="Boolean(editing)"
        :submitting="submitting"
        :initial-value="editing ? {
          effectiveDate: isoDate(editing.effectiveDate),
          pricePerKg: editing.pricePerKg,
          notes: editing.notes ?? '',
        } : undefined"
        @submit="submitPrice"
      />
    </UiDialog>
  </div>
</template>
