<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import type { CoopItem, ExpenseCategoryItem, ExpenseItem, UserItem } from '../types/domain'

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
const activeFilterMenu = ref<'sort' | 'filter' | null>(null)
const sortMenuRef = ref<HTMLElement | null>(null)
const filterMenuRef = ref<HTMLElement | null>(null)
const perPageMenuOpen = ref(false)
const perPageMenuRef = ref<HTMLElement | null>(null)

const coopFilter = ref('')
const ownerFilter = ref('')
const categoryFilter = ref('')
const startDateFilter = ref('')
const endDateFilter = ref('')
const draftCoopFilter = ref('')
const draftOwnerFilter = ref('')
const draftCategoryFilter = ref('')
const draftStartDateFilter = ref('')
const draftEndDateFilter = ref('')
const sortBy = ref('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = [
  { label: 'Tanggal expense', value: 'date', kind: 'date' as const },
  { label: 'Dibuat', value: 'createdAt', kind: 'date' as const },
  { label: 'Jumlah', value: 'amount', kind: 'number' as const },
  { label: 'Label kategori', value: 'categoryLabel', kind: 'text' as const },
]
const pageSizeOptions = [10, 25, 50, 100]

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

function toggleFilterMenu(menu: 'sort' | 'filter') {
  activeFilterMenu.value = activeFilterMenu.value === menu ? null : menu
  perPageMenuOpen.value = false
}

function togglePerPageMenu() {
  perPageMenuOpen.value = !perPageMenuOpen.value
  activeFilterMenu.value = null
}

function clearDraftFilters() {
  draftCoopFilter.value = ''
  draftOwnerFilter.value = ''
  draftCategoryFilter.value = ''
  draftStartDateFilter.value = ''
  draftEndDateFilter.value = ''
}

async function resetFilters() {
  clearDraftFilters()
  coopFilter.value = ''
  ownerFilter.value = ''
  categoryFilter.value = ''
  startDateFilter.value = ''
  endDateFilter.value = ''
  pagination.resetPage()
  activeFilterMenu.value = null
  await loadExpenses()
}

async function applyFilters() {
  coopFilter.value = draftCoopFilter.value
  ownerFilter.value = draftOwnerFilter.value
  categoryFilter.value = draftCategoryFilter.value
  startDateFilter.value = draftStartDateFilter.value
  endDateFilter.value = draftEndDateFilter.value
  pagination.resetPage()
  activeFilterMenu.value = null
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
  perPageMenuOpen.value = false
  await loadExpenses()
}

onMounted(async () => {
  draftCoopFilter.value = coopFilter.value
  draftOwnerFilter.value = ownerFilter.value
  draftCategoryFilter.value = categoryFilter.value
  draftStartDateFilter.value = startDateFilter.value
  draftEndDateFilter.value = endDateFilter.value
  await Promise.all([loadSupporting(), loadExpenses()])
})

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadExpenses()
  }
})

watch(
  [coopFilter, ownerFilter, categoryFilter, startDateFilter, endDateFilter],
  ([nextCoop, nextOwner, nextCategory, nextStartDate, nextEndDate]) => {
    draftCoopFilter.value = nextCoop
    draftOwnerFilter.value = nextOwner
    draftCategoryFilter.value = nextCategory
    draftStartDateFilter.value = nextStartDate
    draftEndDateFilter.value = nextEndDate
  },
)

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
            <UiIcon name="expenses" class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-ink-900">Pengeluaran Kandang</h2>
            <p class="mt-1 text-sm text-ink-600">
              Pengeluaran tersambung ke kandang dan kategori owner.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UiButton variant="secondary" icon="refresh" @click="loadExpenses">Refresh</UiButton>
          <UiButton icon="plus" @click="dialogOpen = true; editing = null">Tambah expense</UiButton>
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
            :class="{ 'border-brand-300 bg-brand-50 text-brand-700': activeFilterMenu === 'filter' || Boolean(coopFilter) || Boolean(ownerFilter) || Boolean(categoryFilter) || Boolean(startDateFilter) || Boolean(endDateFilter) }"
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
          class="surface-outline absolute left-0 top-[calc(100%+0.55rem)] z-[120] w-[min(92vw,25rem)] rounded-2xl p-3 shadow-soft"
        >
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
                :value="draftCoopFilter"
                class="field-shell py-2.5"
                @change="draftCoopFilter = ($event.target as HTMLSelectElement).value"
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
                :value="draftOwnerFilter"
                class="field-shell py-2.5"
                @change="draftOwnerFilter = ($event.target as HTMLSelectElement).value"
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
                :value="draftCategoryFilter"
                class="field-shell py-2.5"
                @change="draftCategoryFilter = ($event.target as HTMLSelectElement).value"
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
              <th class="px-4 py-3 pr-4">Tanggal</th>
              <th class="px-4 py-3 pr-4">Kandang</th>
              <th class="px-4 py-3 pr-4">Kategori</th>
              <th class="px-4 py-3 pr-4">Jumlah</th>
              <th class="px-4 py-3 pr-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr
              v-for="row in pagination.limit.value"
              :key="`expenses-skeleton-${row}`"
              class="border-t border-slate-200/70"
            >
              <td class="px-4 py-4">
                <div class="h-4 w-24 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-10/12 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-8/12 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-20 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="ml-auto h-4 w-24 animate-pulse rounded-xl bg-slate-200/70" />
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="error">
            <tr>
              <td colspan="5" class="px-4 py-14 text-center">
                <p class="text-sm text-rose-700">{{ error }}</p>
                <div class="mt-3 flex justify-center">
                  <UiButton size="sm" icon="refresh" @click="loadExpenses">Coba lagi</UiButton>
                </div>
              </td>
            </tr>
          </tbody>
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
          <tbody v-else>
            <tr>
              <td colspan="5" class="px-4 py-14 text-center text-sm text-ink-500">
                Belum ada data pengeluaran untuk filter saat ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </GlassCard>

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
