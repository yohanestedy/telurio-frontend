<script setup lang="ts">
import type { PriceItem } from '../types/domain'
import { defaultPageSizeOptions } from '../utils/list'

definePageMeta({
  title: 'Daily Prices',
  roles: ['ADMIN'],
})

const api = useApi()
const toast = useToast()
const pagination = usePagination()
const route = useRoute()

const loading = ref(true)
const error = ref('')
const prices = ref<PriceItem[]>([])
const dialogOpen = ref(false)
const editing = ref<PriceItem | null>(null)
const submitting = ref(false)
const prefillTodayPrice = ref(false)

const startDateFilter = ref('')
const endDateFilter = ref('')
const sortBy = ref('effectiveDate')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = [
  { label: 'Tanggal efektif', value: 'effectiveDate', kind: 'date' as const },
  { label: 'Dibuat', value: 'createdAt', kind: 'date' as const },
  { label: 'Harga per kg', value: 'pricePerKg', kind: 'number' as const },
]
const pageSizeOptions = defaultPageSizeOptions
const skeletonCells = [
  { lines: [{ class: 'w-24' }] },
  { lines: [{ class: 'w-20' }] },
  { lines: [{ class: 'w-11/12' }] },
  { lines: [{ class: 'ml-auto w-20 rounded-xl' }] },
]

const { sortOrderOptions } = useListSort(sortBy, orderByOptions)
const pageRangeLabel = usePageRangeLabel(pagination)
const { currentPrice, todayPriceMissing, loadTodayPriceStatus } = useTodayPriceStatus()
const { draftFilters, applyDrafts, resetActive } = useListFilterDrafts({
  startDate: startDateFilter,
  endDate: endDateFilter,
})

const createInitialValue = computed(() =>
  editing.value
    ? {
        effectiveDate: isoDate(editing.value.effectiveDate),
        pricePerKg: editing.value.pricePerKg,
        notes: editing.value.notes ?? '',
      }
    : prefillTodayPrice.value
      ? {
          effectiveDate: isoDate(new Date()),
          pricePerKg: '',
          notes: '',
        }
      : undefined,
)

async function resetFilters() {
  resetActive()
  pagination.resetPage()
  await loadPrices()
}

async function applyFilters() {
  applyDrafts()
  pagination.resetPage()
  await loadPrices()
}

async function loadPrices() {
  loading.value = true
  error.value = ''
  try {
    const [, list] = await Promise.all([
      loadTodayPriceStatus(),
      api.getPage<PriceItem[]>('/prices', {
        ...pagination.query.value,
        sortBy: sortBy.value,
        order: sortOrder.value,
        startDate: startDateFilter.value || undefined,
        endDate: endDateFilter.value || undefined,
      }),
    ])
    prices.value = list.data
    pagination.applyMeta(list.meta)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

function openCreatePriceDialog() {
  editing.value = null
  prefillTodayPrice.value = false
  dialogOpen.value = true
}

function openTodayPriceDialog() {
  editing.value = null
  prefillTodayPrice.value = true
  dialogOpen.value = true
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
    prefillTodayPrice.value = false
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

async function consumeCreateQuery(value: unknown) {
  if (value !== 'today') {
    return
  }

  openTodayPriceDialog()

  const nextQuery = { ...route.query }
  delete nextQuery.create
  await navigateTo({ path: route.path, query: nextQuery }, { replace: true })
}

onMounted(async () => {
  await loadPrices()
})

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadPrices()
  }
})

watch(dialogOpen, (isOpen) => {
  if (!isOpen) {
    editing.value = null
    prefillTodayPrice.value = false
  }
})

watch(
  () => route.query.create,
  (value) => {
    consumeCreateQuery(value)
  },
  { immediate: true },
)

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
        <UiButton
          variant="secondary"
          icon="refresh"
          title="Refresh"
          aria-label="Refresh"
          @click="loadPrices"
        />
        <UiButton
          variant="ghost"
          icon="prices"
          title="Publikasi customer"
          aria-label="Publikasi customer"
          @click="navigateTo('/public/prices')"
        />
        <UiButton icon="plus" @click="openCreatePriceDialog">Tambah</UiButton>
      </template>

      <MetricCard
        label="Harga aktif"
        :value="currentPrice ? formatRupiah(currentPrice.pricePerKg) : '-'"
        :helper="currentPrice ? formatDate(currentPrice.effectiveDate) : 'Harga untuk hari ini belum tersedia'"
        icon="prices"
      />
    </ListHeaderCard>

    <TodayPriceNotice
      v-if="todayPriceMissing"
      title="Harga telur hari ini belum diinput"
      message="Input harga untuk hari ini terlebih dahulu agar order dengan tanggal kirim hari ini bisa diproses tanpa kendala."
      :show-action="true"
      @action="openTodayPriceDialog"
    />

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
          <ListTableSkeletonBody
            v-if="loading"
            :rows="pagination.limit.value"
            row-key-prefix="prices-skeleton"
            :cells="skeletonCells"
          />
          <ListTableStateBody
            v-else-if="error"
            mode="error"
            :colspan="4"
            :message="error"
            @retry="loadPrices"
          />
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
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="4"
            message="Belum ada harga untuk filter saat ini."
          />
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
        :initial-value="createInitialValue"
        @submit="submitPrice"
      />
    </UiDialog>
  </div>
</template>
