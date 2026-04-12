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

const startDateFilter = ref('')
const endDateFilter = ref('')
const draftStartDateFilter = ref('')
const draftEndDateFilter = ref('')
const sortBy = ref('effectiveDate')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = [
  { label: 'Tanggal efektif', value: 'effectiveDate', kind: 'date' as const },
  { label: 'Dibuat', value: 'createdAt', kind: 'date' as const },
  { label: 'Harga per kg', value: 'pricePerKg', kind: 'number' as const },
]
const pageSizeOptions = [10, 25, 50, 100]

const selectedSortKind = computed(() => {
  const option = orderByOptions.find((item) => item.value === sortBy.value)
  return option?.kind ?? 'text'
})

const sortOrderOptions = computed(() => {
  if (selectedSortKind.value === 'date') {
    return [
      { label: 'Terlama', value: 'asc' },
      { label: 'Terbaru', value: 'desc' },
    ]
  }

  if (selectedSortKind.value === 'number') {
    return [
      { label: 'Kecil ke besar', value: 'asc' },
      { label: 'Besar ke kecil', value: 'desc' },
    ]
  }

  return [
    { label: 'A - Z', value: 'asc' },
    { label: 'Z - A', value: 'desc' },
  ]
})

const pageRangeLabel = computed(() => {
  if (pagination.total.value <= 0) {
    return '0 Dari 0'
  }

  const start = (pagination.page.value - 1) * pagination.limit.value + 1
  const end = Math.min(pagination.page.value * pagination.limit.value, pagination.total.value)
  return `${start}-${end} Dari ${pagination.total.value}`
})

async function resetFilters() {
  draftStartDateFilter.value = ''
  draftEndDateFilter.value = ''
  startDateFilter.value = ''
  endDateFilter.value = ''
  pagination.resetPage()
  await loadPrices()
}

async function applyFilters() {
  startDateFilter.value = draftStartDateFilter.value
  endDateFilter.value = draftEndDateFilter.value
  pagination.resetPage()
  await loadPrices()
}

async function loadPrices() {
  loading.value = true
  error.value = ''
  try {
    const [current, list] = await Promise.all([
      api.get<PriceItem>('/prices/current'),
      api.getPage<PriceItem[]>('/prices', {
        ...pagination.query.value,
        sortBy: sortBy.value,
        order: sortOrder.value,
        startDate: startDateFilter.value || undefined,
        endDate: endDateFilter.value || undefined,
      }),
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

async function onPageChange(nextPage: number) {
  pagination.setPage(nextPage)
  await loadPrices()
}

async function onLimitChange(nextLimit: number) {
  pagination.setLimit(nextLimit)
  await loadPrices()
}

onMounted(async () => {
  draftStartDateFilter.value = startDateFilter.value
  draftEndDateFilter.value = endDateFilter.value
  await loadPrices()
})

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadPrices()
  }
})

watch([startDateFilter, endDateFilter], ([nextStartDate, nextEndDate]) => {
  draftStartDateFilter.value = nextStartDate
  draftEndDateFilter.value = nextEndDate
})
</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard
      icon="money"
      title="Riwayat Harga Harian"
      description="Harga per kg yang menjadi source of truth untuk order."
      :align-actions-end="true"
    >
      <template #actions>
        <UiButton variant="secondary" icon="refresh" @click="loadPrices">Refresh</UiButton>
        <UiButton icon="plus" @click="dialogOpen = true; editing = null">Tambah harga</UiButton>
      </template>

      <MetricCard
        label="Harga aktif"
        :value="currentPrice ? formatRupiah(currentPrice.pricePerKg) : '-'"
        :helper="currentPrice ? formatDate(currentPrice.effectiveDate) : 'Belum ada harga aktif'"
        icon="prices"
      />
    </ListHeaderCard>

    <ListTableShell
      :filter-applied="Boolean(startDateFilter) || Boolean(endDateFilter)"
      :page-range-label="pageRangeLabel"
      :current-limit="pagination.limit.value"
      :page-size-options="pageSizeOptions"
      :loading="loading"
      :has-prev-page="pagination.hasPrevPage.value"
      :has-next-page="pagination.hasNextPage.value"
      @previous-page="onPageChange(pagination.page.value - 1)"
      @next-page="onPageChange(pagination.page.value + 1)"
      @change-limit="onLimitChange"
    >
      <template #sort-menu>
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Urutkan</p>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <select
              :value="sortBy"
              class="field-shell py-2.5"
              @change="sortBy = ($event.target as HTMLSelectElement).value"
            >
              <option v-for="item in orderByOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
            <select
              :value="sortOrder"
              class="field-shell py-2.5"
              @change="sortOrder = ($event.target as HTMLSelectElement).value as 'asc' | 'desc'"
            >
              <option v-for="item in sortOrderOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </div>
      </template>

      <template #filter-menu>
          <div class="mb-3 flex items-center gap-2">
            <UiIcon name="filter" class="h-4 w-4 text-brand-700" />
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Filter Data</p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="calendar" class="h-3.5 w-3.5 text-ink-500" />
                <span>Dari tanggal</span>
              </p>
              <input
                :value="draftStartDateFilter"
                type="date"
                class="field-shell py-2.5"
                @input="draftStartDateFilter = ($event.target as HTMLInputElement).value"
              >
            </div>
            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="calendar" class="h-3.5 w-3.5 text-ink-500" />
                <span>Sampai tanggal</span>
              </p>
              <input
                :value="draftEndDateFilter"
                type="date"
                class="field-shell py-2.5"
                @input="draftEndDateFilter = ($event.target as HTMLInputElement).value"
              >
            </div>
          </div>

          <div class="mt-3 flex items-center justify-end gap-2 border-t border-slate-200/80 pt-3">
            <UiButton size="sm" variant="ghost" icon="refresh" @click="resetFilters">
              Reset
            </UiButton>
            <UiButton size="sm" icon="filter" @click="applyFilters">
              Terapkan
            </UiButton>
          </div>
      </template>

      <template #default>
        <table class="min-w-full text-left text-sm">
          <thead class="sticky top-0 z-10 bg-white/90 text-ink-500 backdrop-blur-sm">
            <tr>
              <th class="px-4 py-3 pr-4">Tanggal</th>
              <th class="px-4 py-3 pr-4">Harga</th>
              <th class="px-4 py-3 pr-4">Catatan</th>
              <th class="px-4 py-3 pr-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr
              v-for="row in pagination.limit.value"
              :key="`prices-skeleton-${row}`"
              class="border-t border-slate-200/70"
            >
              <td class="px-4 py-4">
                <div class="h-4 w-24 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-20 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-11/12 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="ml-auto h-4 w-20 animate-pulse rounded-xl bg-slate-200/70" />
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="error">
            <tr>
              <td colspan="4" class="px-4 py-14 text-center">
                <p class="text-sm text-rose-700">{{ error }}</p>
                <div class="mt-3 flex justify-center">
                  <UiButton size="sm" icon="refresh" @click="loadPrices">Coba lagi</UiButton>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="prices.length">
            <tr v-for="price in prices" :key="price.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4">{{ formatDate(price.effectiveDate) }}</td>
              <td class="px-4 py-4 pr-4 font-medium text-ink-900">{{ formatRupiah(price.pricePerKg) }}</td>
              <td class="px-4 py-4 pr-4">{{ price.notes || '-' }}</td>
              <td class="px-4 py-4 text-right">
                <UiButton variant="ghost" size="sm" icon="edit" @click="dialogOpen = true; editing = price">
                  Edit
                </UiButton>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="4" class="px-4 py-14 text-center text-sm text-ink-500">
                Belum ada harga untuk filter saat ini.
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </ListTableShell>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit harga' : 'Tambah harga baru'"
      description="Harga akan dipakai saat order dibayar lunas atau delivery dimulai."
    >
      <FormsPriceForm
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
