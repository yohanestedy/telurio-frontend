<script setup lang="ts">
import type { CoopItem, ExpenseCategoryItem, ExpenseItem, UserItem } from '../types/domain'
import { defaultPageSizeOptions } from '../utils/list'

definePageMeta({
  title: 'Expenses',
  roles: ['ADMIN', 'OWNER'],
})

const api = useApi()
const toast = useToast()
const auth = useAuthStore()
const pagination = usePagination()

const loading = ref(true)
const error = ref('')
const expenses = ref<ExpenseItem[]>([])
const coops = ref<CoopItem[]>([])
const categories = ref<ExpenseCategoryItem[]>([])
const owners = ref<UserItem[]>([])
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editing = ref<ExpenseItem | null>(null)
const deleting = ref<ExpenseItem | null>(null)
const submitting = ref(false)

const coopFilter = ref('')
const ownerFilter = ref('')
const categoryFilter = ref('')
const startDateFilter = ref('')
const endDateFilter = ref('')
const sortBy = ref('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = [
  { label: 'Tanggal expense', value: 'date', kind: 'date' as const },
  { label: 'Dibuat', value: 'createdAt', kind: 'date' as const },
  { label: 'Jumlah', value: 'amount', kind: 'number' as const },
  { label: 'Label kategori', value: 'categoryLabel', kind: 'text' as const },
]
const pageSizeOptions = defaultPageSizeOptions
const skeletonCells = [
  { lines: [{ class: 'w-24' }] },
  { lines: [{ class: 'w-10/12' }] },
  { lines: [{ class: 'w-8/12' }] },
  { lines: [{ class: 'w-20' }] },
  { lines: [{ class: 'ml-auto w-24 rounded-xl' }] },
]

const coopOptions = computed(() =>
  coops.value.map((item) => ({ label: item.name, value: item.id })),
)

const ownerOptions = computed(() =>
  owners.value.map((item) => ({ label: item.name, value: item.id })),
)

const categoryOptions = computed(() =>
  categories.value.filter((item) => item.isActive).map((item) => ({ label: item.name, value: item.id })),
)

const categoryFilterOptions = computed(() =>
  categories.value.map((item) => ({ label: item.name, value: item.id })),
)

const { sortOrderOptions } = useListSort(sortBy, orderByOptions)
const pageRangeLabel = usePageRangeLabel(pagination)
const { draftFilters, applyDrafts, resetActive } = useListFilterDrafts({
  coopId: coopFilter,
  ownerId: ownerFilter,
  expenseCategoryId: categoryFilter,
  startDate: startDateFilter,
  endDate: endDateFilter,
})

async function resetFilters() {
  resetActive()
  pagination.resetPage()
  await loadExpenses()
}

async function applyFilters() {
  applyDrafts()
  pagination.resetPage()
  await loadExpenses()
}

async function loadSupporting() {
  const requests = [
    api.getPage<CoopItem[]>('/coops', { all: true }),
    api.get<ExpenseCategoryItem[]>('/expense-categories'),
  ] as const

  const responses = await Promise.all([
    ...requests,
    auth.role === 'ADMIN'
      ? api.getPage<UserItem[]>('/users', { all: true, role: 'OWNER' })
      : Promise.resolve({ data: [] as UserItem[] }),
  ])

  coops.value = responses[0].data
  categories.value = responses[1]
  owners.value = responses[2].data
}

async function loadExpenses() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getPage<ExpenseItem[]>('/expenses', {
      ...pagination.query.value,
      sortBy: sortBy.value,
      order: sortOrder.value,
      coopId: coopFilter.value || undefined,
      ownerId: auth.role === 'ADMIN' ? ownerFilter.value || undefined : undefined,
      expenseCategoryId: categoryFilter.value || undefined,
      startDate: startDateFilter.value || undefined,
      endDate: endDateFilter.value || undefined,
    })
    expenses.value = response.data
    pagination.applyMeta(response.meta)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function submitExpense(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/expenses/${editing.value.id}`, {
        date: payload.date,
        categoryLabel: payload.categoryLabel,
        description: payload.description,
        amount: payload.amount,
        notes: payload.notes,
      })
      toast.success('Pengeluaran berhasil diperbarui')
    } else {
      await api.post('/expenses', payload)
      toast.success('Pengeluaran berhasil dibuat')
    }
    dialogOpen.value = false
    editing.value = null
    await loadExpenses()
  } catch (caught) {
    toast.error('Gagal menyimpan pengeluaran', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function deleteExpense(payload: { deleteReason: string }) {
  if (!deleting.value) {
    return
  }

  submitting.value = true
  try {
    await api.delete(`/expenses/${deleting.value.id}`, payload)
    toast.success('Pengeluaran berhasil dihapus')
    deleteDialogOpen.value = false
    deleting.value = null
    await loadExpenses()
  } catch (caught) {
    toast.error('Gagal menghapus pengeluaran', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function onPageChange(nextPage: number) {
  pagination.setPage(nextPage)
  await loadExpenses()
}

async function onLimitChange(nextLimit: number) {
  pagination.setLimit(nextLimit)
  await loadExpenses()
}

onMounted(async () => {
  await Promise.all([loadSupporting(), loadExpenses()])
})

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadExpenses()
  }
})

</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard
      icon="expenses"
      title="Pengeluaran Kandang"
      description="Pengeluaran tersambung ke kandang dan kategori owner."
    >
      <template #actions>
        <UiButton variant="secondary" icon="refresh" @click="loadExpenses">Refresh</UiButton>
        <UiButton icon="plus" @click="dialogOpen = true; editing = null">Tambah expense</UiButton>
      </template>
    </ListHeaderCard>

    <ListTableShell
      :filter-applied="Boolean(coopFilter) || Boolean(ownerFilter) || Boolean(categoryFilter) || Boolean(startDateFilter) || Boolean(endDateFilter)"
      :page-range-label="pageRangeLabel"
      :current-limit="pagination.limit.value"
      :page-size-options="pageSizeOptions"
      :loading="loading"
      :has-prev-page="pagination.hasPrevPage.value"
      :has-next-page="pagination.hasNextPage.value"
      filter-menu-width-class="w-[min(92vw,25rem)]"
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

            <div v-if="auth.role === 'ADMIN'" class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="users" class="h-3.5 w-3.5 text-ink-500" />
                <span>Owner</span>
              </p>
              <select
                :value="draftFilters.ownerId"
                class="field-shell py-2.5"
                @change="draftFilters.ownerId = ($event.target as HTMLSelectElement).value"
              >
                <option value="">Semua owner</option>
                <option v-for="item in ownerOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>

            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="categories" class="h-3.5 w-3.5 text-ink-500" />
                <span>Kategori</span>
              </p>
              <select
                :value="draftFilters.expenseCategoryId"
                class="field-shell py-2.5"
                @change="draftFilters.expenseCategoryId = ($event.target as HTMLSelectElement).value"
              >
                <option value="">Semua kategori</option>
                <option v-for="item in categoryFilterOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1.5">
                <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                  <UiIcon name="calendar" class="h-3.5 w-3.5 text-ink-500" />
                  <span>Dari tanggal</span>
                </p>
                <input
                  :value="draftFilters.startDate"
                  type="date"
                  class="field-shell py-2.5"
                  @input="draftFilters.startDate = ($event.target as HTMLInputElement).value"
                >
              </div>
              <div class="space-y-1.5">
                <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                  <UiIcon name="calendar" class="h-3.5 w-3.5 text-ink-500" />
                  <span>Sampai tanggal</span>
                </p>
                <input
                  :value="draftFilters.endDate"
                  type="date"
                  class="field-shell py-2.5"
                  @input="draftFilters.endDate = ($event.target as HTMLInputElement).value"
                >
              </div>
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
              <th class="px-4 py-3 pr-4">Kategori</th>
              <th class="px-4 py-3 pr-4">Jumlah</th>
              <th class="px-4 py-3 pr-4 text-right">Aksi</th>
            </tr>
          </thead>
          <ListTableSkeletonBody
            v-if="loading"
            :rows="pagination.limit.value"
            row-key-prefix="expenses-skeleton"
            :cells="skeletonCells"
          />
          <ListTableStateBody
            v-else-if="error"
            mode="error"
            :colspan="5"
            :message="error"
            @retry="loadExpenses"
          />
          <tbody v-else-if="expenses.length">
            <tr v-for="item in expenses" :key="item.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4">{{ formatDate(item.date) }}</td>
              <td class="px-4 py-4 pr-4">{{ item.coopName }}</td>
              <td class="px-4 py-4 pr-4">{{ item.categoryLabel }}</td>
              <td class="px-4 py-4 pr-4 font-medium text-ink-900">{{ formatRupiah(item.amount) }}</td>
              <td class="px-4 py-4 text-right">
                <div class="flex justify-end gap-1">
                  <UiButton variant="ghost" size="sm" icon="edit" @click="dialogOpen = true; editing = item">
                    Edit
                  </UiButton>
                  <UiButton variant="ghost" size="sm" icon="delete" @click="deleteDialogOpen = true; deleting = item">
                    Hapus
                  </UiButton>
                </div>
              </td>
            </tr>
          </tbody>
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="5"
            message="Belum ada data pengeluaran untuk filter saat ini."
          />
        </table>
      </template>
    </ListTableShell>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit expense' : 'Tambah expense'"
      description="Expense akan masuk ke laporan net income kandang."
      size="xl"
    >
      <FormsExpenseForm
        :coop-options="coopOptions"
        :category-options="categoryOptions"
        :submitting="submitting"
        :is-edit="Boolean(editing)"
        :initial-value="editing ? {
          date: isoDate(editing.date),
          coopId: editing.coopId,
          expenseCategoryId: editing.expenseCategoryId ?? '',
          categoryLabel: editing.categoryLabel,
          description: editing.description ?? '',
          amount: editing.amount,
          notes: editing.notes ?? '',
        } : undefined"
        @submit="submitExpense"
      />
    </UiDialog>

    <UiDialog
      v-model:open="deleteDialogOpen"
      title="Hapus pengeluaran"
      description="Masukkan alasan agar perubahan tetap jelas di audit trail."
    >
      <FormsDeleteReasonForm :submitting="submitting" @submit="deleteExpense" />
    </UiDialog>
  </div>
</template>
