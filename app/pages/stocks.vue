<script setup lang="ts">
import { useListFilterDrafts } from '../composables/useListFilterDrafts'
import type {
  CoopItem,
  StockMovementDirection,
  StockMovementItem,
  StockMovementType,
} from '../types/domain'
import {
  stockMovementDirections,
  stockMovementTypes,
} from '../types/domain'
import { defaultPageSizeOptions } from '../utils/list'

definePageMeta({
  title: 'Stocks',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
})

const api = useApi()
const pagination = usePagination()

const loading = ref(true)
const error = ref('')
const movements = ref<StockMovementItem[]>([])
const coops = ref<CoopItem[]>([])

const coopFilter = ref('')
const directionFilter = ref('')
const movementTypeFilter = ref('')
const startDateFilter = ref('')
const endDateFilter = ref('')
const sortBy = ref<'movementDate' | 'createdAt' | 'quantityKg' | 'movementType'>('movementDate')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = [
  { label: 'Tanggal movement', value: 'movementDate', kind: 'date' as const },
  { label: 'Waktu dicatat', value: 'createdAt', kind: 'date' as const },
  { label: 'Jumlah kg', value: 'quantityKg', kind: 'number' as const },
  { label: 'Jenis movement', value: 'movementType', kind: 'text' as const },
]
const pageSizeOptions: number[] = [...defaultPageSizeOptions]
const skeletonCells = [
  { lines: [{ class: 'w-24' }] },
  { lines: [{ class: 'w-10/12' }] },
  { lines: [{ class: 'w-40' }] },
  { lines: [{ class: 'w-16 rounded-full' }] },
  { lines: [{ class: 'w-16' }] },
  { lines: [{ class: 'w-24' }] },
  { lines: [{ class: 'w-32' }] },
]

const directionOptions = stockMovementDirections.map((item) => ({
  label: directionLabel(item),
  value: item,
}))
const movementTypeOptions = stockMovementTypes.map((item) => ({
  label: movementTypeLabel(item),
  value: item,
}))
const coopOptions = computed(() =>
  coops.value.map((item) => ({ label: item.name, value: item.id })),
)

const { sortOrderOptions } = useListSort(sortBy, orderByOptions)
const pageRangeLabel = usePageRangeLabel(pagination)
const { draftFilters, applyDrafts, resetActive } = useListFilterDrafts(
  {
    coopId: coopFilter,
    direction: directionFilter,
    movementType: movementTypeFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  },
)

async function resetFilters() {
  resetActive()
  pagination.resetPage()
  await loadMovements()
}

async function applyFilters() {
  applyDrafts()
  pagination.resetPage()
  await loadMovements()
}

async function loadSupporting() {
  const response = await api.getPage<CoopItem[]>('/coops', { all: true })
  coops.value = response.data
}

async function loadMovements() {
  loading.value = true
  error.value = ''

  try {
    const response = await api.getPage<StockMovementItem[]>('/stocks/movements', {
      ...pagination.query.value,
      sortBy: sortBy.value,
      order: sortOrder.value,
      coopId: coopFilter.value || undefined,
      direction: directionFilter.value || undefined,
      movementType: movementTypeFilter.value || undefined,
      startDate: startDateFilter.value || undefined,
      endDate: endDateFilter.value || undefined,
    })

    movements.value = response.data
    pagination.applyMeta(response.meta)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  await Promise.all([loadSupporting(), loadMovements()])
}

async function onPageChange(nextPage: number) {
  pagination.setPage(nextPage)
  await loadMovements()
}

async function onLimitChange(nextLimit: number) {
  pagination.setLimit(nextLimit)
  await loadMovements()
}

function directionLabel(value: StockMovementDirection) {
  if (value === 'IN') {
    return 'Masuk'
  }

  return 'Keluar'
}

function movementTypeLabel(value: StockMovementType) {
  return {
    PRODUCTION_IN: 'Produksi Masuk',
    PRODUCTION_CORRECTION_IN: 'Koreksi Produksi (+)',
    PRODUCTION_CORRECTION_OUT: 'Koreksi Produksi (-)',
    ALLOCATION_OUT: 'Alokasi Keluar',
    ALLOCATION_RELEASE: 'Alokasi Dikembalikan',
    MANUAL_ADJUST_IN: 'Penyesuaian Manual (+)',
    MANUAL_ADJUST_OUT: 'Penyesuaian Manual (-)',
  }[value]
}

function sourceLabel(value: StockMovementItem['sourceType']) {
  return {
    PRODUCTION_RECORD: 'Produksi',
    ORDER_ALLOCATION: 'Alokasi Order',
    MANUAL_ADJUSTMENT: 'Manual',
  }[value]
}

onMounted(async () => {
  await Promise.all([loadSupporting(), loadMovements()])
})

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadMovements()
  }
})
</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard
      icon="layers"
      title="Ledger Stock"
      description="Riwayat pergerakan stok masuk dan keluar per kandang."
    >
      <template #actions>
        <UiButton
          variant="secondary"
          icon="refresh"
          title="Refresh"
          aria-label="Refresh"
          @click="refreshData"
        />
      </template>
    </ListHeaderCard>

    <ListTableShell
      :filter-applied="Boolean(coopFilter) || Boolean(directionFilter) || Boolean(movementTypeFilter) || Boolean(startDateFilter) || Boolean(endDateFilter)"
      :page-range-label="pageRangeLabel"
      :current-limit="pagination.limit.value"
      :page-size-options="pageSizeOptions"
      :loading="loading"
      :has-prev-page="pagination.hasPrevPage.value"
      :has-next-page="pagination.hasNextPage.value"
      filter-menu-width-class="w-[min(92vw,24rem)]"
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
              @change="sortBy = ($event.target as HTMLSelectElement).value as 'movementDate' | 'createdAt' | 'quantityKg' | 'movementType'"
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

          <div class="space-y-3">
            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="coops" class="h-3.5 w-3.5 text-ink-500" />
                <span>Kandang</span>
              </p>
              <select
                :value="draftFilters.coopId"
                class="field-shell py-2.5"
                @change="draftFilters.coopId = ($event.target as HTMLSelectElement).value"
              >
                <option value="">Semua kandang</option>
                <option v-for="item in coopOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1.5">
                <p class="text-xs font-medium text-ink-600">Arah movement</p>
                <select
                  :value="draftFilters.direction"
                  class="field-shell py-2.5"
                  @change="draftFilters.direction = ($event.target as HTMLSelectElement).value"
                >
                  <option value="">Semua arah</option>
                  <option v-for="item in directionOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>
              <div class="space-y-1.5">
                <p class="text-xs font-medium text-ink-600">Jenis movement</p>
                <select
                  :value="draftFilters.movementType"
                  class="field-shell py-2.5"
                  @change="draftFilters.movementType = ($event.target as HTMLSelectElement).value"
                >
                  <option value="">Semua jenis</option>
                  <option v-for="item in movementTypeOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <UiDatePicker
                v-model="draftFilters.startDate"
                label="Dari tanggal"
                placeholder="Pilih tanggal awal"
              />
              <UiDatePicker
                v-model="draftFilters.endDate"
                label="Sampai tanggal"
                placeholder="Pilih tanggal akhir"
              />
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
              <th class="px-4 py-3 pr-4">Kandang</th>
              <th class="px-4 py-3 pr-4">Jenis</th>
              <th class="px-4 py-3 pr-4">Arah</th>
              <th class="px-4 py-3 pr-4">Kg</th>
              <th class="px-4 py-3 pr-4">Sumber</th>
              <th class="px-4 py-3 pr-4">Dicatat</th>
            </tr>
          </thead>
          <ListTableSkeletonBody
            v-if="loading"
            :rows="pagination.limit.value"
            row-key-prefix="stocks-skeleton"
            :cells="skeletonCells"
          />
          <ListTableStateBody
            v-else-if="error"
            mode="error"
            :colspan="7"
            :message="error"
            @retry="loadMovements"
          />
          <tbody v-else-if="movements.length">
            <tr v-for="item in movements" :key="item.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4">{{ formatDate(item.movementDate) }}</td>
              <td class="px-4 py-4 pr-4">{{ item.coopName }}</td>
              <td class="px-4 py-4 pr-4">{{ movementTypeLabel(item.movementType) }}</td>
              <td class="px-4 py-4 pr-4">
                <span
                  class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                  :class="item.direction === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'"
                >
                  {{ directionLabel(item.direction) }}
                </span>
              </td>
              <td class="px-4 py-4 pr-4">{{ item.quantityKg }}</td>
              <td class="px-4 py-4 pr-4">{{ sourceLabel(item.sourceType) }}</td>
              <td class="px-4 py-4 pr-4 text-xs text-ink-600">
                <p>{{ formatDateTime(item.createdAt) }}</p>
                <p>{{ item.createdByName || '-' }}</p>
              </td>
            </tr>
          </tbody>
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="7"
            message="Belum ada data movement stok untuk filter saat ini."
          />
        </table>
      </template>
    </ListTableShell>
  </div>
</template>
