<script setup lang="ts">
import type { CustomerItem } from '../types/domain'
import { defaultPageSizeOptions } from '../utils/list'

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
const dialogOpen = ref(false)
const editing = ref<CustomerItem | null>(null)
const submitting = ref(false)
const sortBy = ref('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = [
  { label: 'Dibuat', value: 'createdAt', kind: 'date' as const },
  { label: 'Nama', value: 'name', kind: 'text' as const },
  { label: 'Telepon', value: 'phone', kind: 'text' as const },
]
const pageSizeOptions = defaultPageSizeOptions
const skeletonCells = [
  { lines: [{ class: 'w-10/12' }] },
  { lines: [{ class: 'w-8/12' }] },
  { lines: [{ class: 'w-11/12' }] },
  { lines: [{ class: 'ml-auto w-20 rounded-xl' }] },
]

const { sortOrderOptions } = useListSort(sortBy, orderByOptions)
const pageRangeLabel = usePageRangeLabel(pagination)
const { draftFilters, applyDrafts, resetActive } = useListFilterDrafts(
  { search },
  {
    apply: (draftValues, activeFilters) => {
      activeFilters.search.value = draftValues.search.trim()
    },
  },
)

async function resetFilters() {
  resetActive()
  pagination.resetPage()
  await loadCustomers()
}

async function applyFilters() {
  applyDrafts()
  pagination.resetPage()
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
  await loadCustomers()
}

onMounted(loadCustomers)

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadCustomers()
  }
})

</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard
      icon="customers"
      title="Daftar Pelanggan"
      description="Data customer yang dipakai saat membuat order."
    >
      <template #actions>
        <UiButton variant="secondary" icon="refresh" @click="loadCustomers">Refresh</UiButton>
        <UiButton icon="plus" @click="dialogOpen = true; editing = null">Tambah pelanggan</UiButton>
      </template>
    </ListHeaderCard>

    <ListTableShell
      :filter-applied="Boolean(search)"
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

          <div class="space-y-1.5">
            <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
              <UiIcon name="search" class="h-3.5 w-3.5 text-ink-500" />
              <span>Cari pelanggan</span>
            </p>
            <input
              v-model="draftFilters.search"
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
      </template>

      <template #default>
        <table class="min-w-full text-left text-sm">
          <thead class="sticky top-0 z-10 bg-white/90 text-ink-500 backdrop-blur-sm">
            <tr>
              <th class="px-4 py-3 pr-4">Nama</th>
              <th class="px-4 py-3 pr-4">Telepon</th>
              <th class="px-4 py-3 pr-4">Alamat</th>
              <th class="px-4 py-3 pr-4 text-right">Aksi</th>
            </tr>
          </thead>
          <ListTableSkeletonBody
            v-if="loading"
            :rows="pagination.limit.value"
            row-key-prefix="customers-skeleton"
            :cells="skeletonCells"
          />
          <ListTableStateBody
            v-else-if="error"
            mode="error"
            :colspan="4"
            :message="error"
            @retry="loadCustomers"
          />
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
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="4"
            message="Belum ada pelanggan untuk filter saat ini."
          />
        </table>
      </template>
    </ListTableShell>

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
