<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import type { CustomerItem } from '../types/domain'

definePageMeta({
  title: 'Customers',
  roles: ['ADMIN'],
})

const api = useApi()
const toast = useToast()
const pagination = usePagination()

const loading = ref(true)
const error = ref('')
const customers = ref<CustomerItem[]>([])
const search = ref('')
const draftSearch = ref('')
const dialogOpen = ref(false)
const editing = ref<CustomerItem | null>(null)
const submitting = ref(false)
const activeFilterMenu = ref<'sort' | 'filter' | null>(null)
const sortMenuRef = ref<HTMLElement | null>(null)
const filterMenuRef = ref<HTMLElement | null>(null)
const perPageMenuOpen = ref(false)
const perPageMenuRef = ref<HTMLElement | null>(null)
const sortBy = ref('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = [
  { label: 'Dibuat', value: 'createdAt', kind: 'date' as const },
  { label: 'Nama', value: 'name', kind: 'text' as const },
  { label: 'Telepon', value: 'phone', kind: 'text' as const },
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

function toggleFilterMenu(menu: 'sort' | 'filter') {
  activeFilterMenu.value = activeFilterMenu.value === menu ? null : menu
  perPageMenuOpen.value = false
}

function togglePerPageMenu() {
  perPageMenuOpen.value = !perPageMenuOpen.value
  activeFilterMenu.value = null
}

async function resetFilters() {
  draftSearch.value = ''
  search.value = ''
  pagination.resetPage()
  activeFilterMenu.value = null
  await loadCustomers()
}

async function applyFilters() {
  search.value = draftSearch.value.trim()
  pagination.resetPage()
  activeFilterMenu.value = null
  await loadCustomers()
}

async function loadCustomers() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getPage<CustomerItem[]>('/customers', {
      ...pagination.query.value,
      sortBy: sortBy.value,
      order: sortOrder.value,
      search: search.value || undefined,
    })
    customers.value = response.data
    pagination.applyMeta(response.meta)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function submitCustomer(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/customers/${editing.value.id}`, payload)
      toast.success('Pelanggan berhasil diperbarui')
    } else {
      await api.post('/customers', payload)
      toast.success('Pelanggan berhasil dibuat')
    }
    dialogOpen.value = false
    editing.value = null
    await loadCustomers()
  } catch (caught) {
    toast.error('Gagal menyimpan pelanggan', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function onPageChange(nextPage: number) {
  pagination.setPage(nextPage)
  await loadCustomers()
}

async function onLimitChange(nextLimit: number) {
  pagination.setLimit(nextLimit)
  perPageMenuOpen.value = false
  await loadCustomers()
}

onMounted(async () => {
  draftSearch.value = search.value
  await loadCustomers()
})

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadCustomers()
  }
})

watch(search, (nextValue) => {
  draftSearch.value = nextValue
})

onClickOutside(sortMenuRef, () => {
  if (activeFilterMenu.value === 'sort') {
    activeFilterMenu.value = null
  }
})

onClickOutside(filterMenuRef, () => {
  if (activeFilterMenu.value === 'filter') {
    activeFilterMenu.value = null
  }
})

onClickOutside(perPageMenuRef, () => {
  perPageMenuOpen.value = false
})
</script>

<template>
  <div class="space-y-4">
    <GlassCard>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex items-start gap-3">
          <div class="surface-outline rounded-2xl p-2.5 text-brand-700">
            <UiIcon name="customers" class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-ink-900">Daftar Pelanggan</h2>
            <p class="mt-1 text-sm text-ink-600">
              Data customer yang dipakai saat membuat order.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UiButton variant="secondary" icon="refresh" @click="loadCustomers">Refresh</UiButton>
          <UiButton icon="plus" @click="dialogOpen = true; editing = null">Tambah pelanggan</UiButton>
        </div>
      </div>
    </GlassCard>

    <GlassCard :overflow-visible="true">
      <div class="relative z-20 mb-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            title="Urutkan data"
            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-ink-700 transition hover:bg-white"
            :class="{ 'border-brand-300 bg-brand-50 text-brand-700': activeFilterMenu === 'sort' }"
            @click="toggleFilterMenu('sort')"
          >
            <UiIcon name="sort" class="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Filter data"
            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-ink-700 transition hover:bg-white"
            :class="{ 'border-brand-300 bg-brand-50 text-brand-700': activeFilterMenu === 'filter' || Boolean(search) }"
            @click="toggleFilterMenu('filter')"
          >
            <UiIcon name="filter" class="h-4 w-4" />
          </button>
        </div>

        <div class="relative flex items-center gap-1.5">
          <div class="h-6 w-px bg-slate-200" />
          <button
            type="button"
            title="Ubah jumlah data per halaman"
            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-ink-700 transition hover:bg-white"
            :class="{ 'border-brand-300 bg-brand-50 text-brand-700': perPageMenuOpen }"
            @click="togglePerPageMenu"
          >
            <UiIcon name="layers" class="h-4 w-4" />
          </button>
          <p class="text-sm text-ink-700">{{ pageRangeLabel }}</p>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
            :disabled="loading || !pagination.hasPrevPage.value"
            @click="onPageChange(pagination.page.value - 1)"
          >
            <UiIcon name="chevronLeft" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
            :disabled="loading || !pagination.hasNextPage.value"
            @click="onPageChange(pagination.page.value + 1)"
          >
            <UiIcon name="chevronRight" class="h-4 w-4" />
          </button>

          <div
            v-if="perPageMenuOpen"
            ref="perPageMenuRef"
            class="surface-outline absolute right-0 top-[calc(100%+0.55rem)] z-[120] w-36 rounded-2xl p-1.5 shadow-soft"
          >
            <button
              v-for="size in pageSizeOptions"
              :key="size"
              type="button"
              class="w-full rounded-xl px-3 py-2 text-left text-sm transition"
              :class="pagination.limit.value === size ? 'bg-brand-100/70 text-brand-800' : 'text-ink-700 hover:bg-slate-100/80'"
              @click="onLimitChange(size)"
            >
              {{ size }} Item
            </button>
          </div>
        </div>

        <div
          v-if="activeFilterMenu === 'sort'"
          ref="sortMenuRef"
          class="surface-outline absolute left-0 top-[calc(100%+0.55rem)] z-[120] w-[min(92vw,22rem)] rounded-2xl p-3 shadow-soft"
        >
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
        </div>

        <div
          v-if="activeFilterMenu === 'filter'"
          ref="filterMenuRef"
          class="surface-outline absolute left-0 top-[calc(100%+0.55rem)] z-[120] w-[min(92vw,24rem)] rounded-2xl p-3 shadow-soft"
        >
          <div class="mb-3 flex items-center gap-2">
            <UiIcon name="filter" class="h-4 w-4 text-brand-700" />
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Filter Data</p>
          </div>

          <div class="space-y-1.5">
            <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
              <UiIcon name="search" class="h-3.5 w-3.5 text-ink-500" />
              <span>Cari pelanggan</span>
            </p>
            <input
              v-model="draftSearch"
              type="text"
              class="field-shell py-2.5"
              placeholder="Nama atau nomor telepon"
            >
          </div>

          <div class="mt-3 flex items-center justify-end gap-2 border-t border-slate-200/80 pt-3">
            <UiButton size="sm" variant="ghost" icon="refresh" @click="resetFilters">
              Reset
            </UiButton>
            <UiButton size="sm" icon="filter" @click="applyFilters">
              Terapkan
            </UiButton>
          </div>
        </div>
      </div>

      <div class="my-3 h-px bg-slate-200/80" />

      <div class="relative z-10 h-[420px] overflow-auto rounded-2xl border border-slate-200/80 bg-white/55">
        <table class="min-w-full text-left text-sm">
          <thead class="sticky top-0 z-10 bg-white/90 text-ink-500 backdrop-blur-sm">
            <tr>
              <th class="px-4 py-3 pr-4">Nama</th>
              <th class="px-4 py-3 pr-4">Telepon</th>
              <th class="px-4 py-3 pr-4">Alamat</th>
              <th class="px-4 py-3 pr-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr
              v-for="row in pagination.limit.value"
              :key="`customers-skeleton-${row}`"
              class="border-t border-slate-200/70"
            >
              <td class="px-4 py-4">
                <div class="h-4 w-10/12 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-8/12 animate-pulse rounded-md bg-slate-200/70" />
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
                  <UiButton size="sm" icon="refresh" @click="loadCustomers">Coba lagi</UiButton>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="customers.length">
            <tr v-for="customer in customers" :key="customer.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4 font-medium text-ink-900">{{ customer.name }}</td>
              <td class="px-4 py-4 pr-4">{{ customer.phone || '-' }}</td>
              <td class="px-4 py-4 pr-4">{{ customer.address || '-' }}</td>
              <td class="px-4 py-4 text-right">
                <UiButton variant="ghost" size="sm" icon="edit" @click="dialogOpen = true; editing = customer">
                  Edit
                </UiButton>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="4" class="px-4 py-14 text-center text-sm text-ink-500">
                Belum ada pelanggan untuk filter saat ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </GlassCard>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit pelanggan' : 'Tambah pelanggan'"
      description="Pelanggan baru akan langsung tersedia saat form order dibuka."
    >
      <FormsCustomerForm
        :initial-value="editing ? {
          name: editing.name,
          phone: editing.phone ?? '',
          address: editing.address ?? '',
        } : undefined"
        :submitting="submitting"
        @submit="submitCustomer"
      />
    </UiDialog>
  </div>
</template>
