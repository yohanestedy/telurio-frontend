<script setup lang="ts">
import type { CoopItem, ExpenseCategoryItem, ExpenseItem } from '../types/domain'

definePageMeta({
  title: 'Expenses',
  roles: ['ADMIN', 'OWNER'],
})

const api = useApi()
const toast = useToast()
const pagination = usePagination()

const loading = ref(true)
const error = ref('')
const expenses = ref<ExpenseItem[]>([])
const coops = ref<CoopItem[]>([])
const categories = ref<ExpenseCategoryItem[]>([])
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editing = ref<ExpenseItem | null>(null)
const deleting = ref<ExpenseItem | null>(null)
const submitting = ref(false)
const coopFilter = ref('')

const coopOptions = computed(() =>
  coops.value.map((item) => ({ label: item.name, value: item.id })),
)

const categoryOptions = computed(() =>
  categories.value.filter((item) => item.isActive).map((item) => ({ label: item.name, value: item.id })),
)

async function loadSupporting() {
  const [coopsResponse, categoryList] = await Promise.all([
    api.getPage<CoopItem[]>('/coops', { all: true }),
    api.get<ExpenseCategoryItem[]>('/expense-categories'),
  ])
  coops.value = coopsResponse.data
  categories.value = categoryList
}

async function loadExpenses() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getPage<ExpenseItem[]>('/expenses', {
      ...pagination.query.value,
      coopId: coopFilter.value || undefined,
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
      await api.patch(`/expenses/${editing.value.id}`, payload)
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

async function onAllChange(nextAll: boolean) {
  pagination.setAll(nextAll)
  await loadExpenses()
}

onMounted(async () => {
  await Promise.all([loadSupporting(), loadExpenses()])
})

watch(coopFilter, () => {
  pagination.resetPage()
  loadExpenses()
})
</script>

<template>
  <div class="space-y-6">
    <FilterBar>
      <UiSelect
        v-model="coopFilter"
        :options="coopOptions"
        label="Filter kandang"
        placeholder="Semua kandang"
      />
      <template #actions>
        <UiButton variant="secondary" icon="refresh" @click="loadExpenses">Refresh</UiButton>
        <UiButton icon="plus" @click="dialogOpen = true; editing = null">Tambah expense</UiButton>
      </template>
    </FilterBar>

    <LoadingSkeleton
      v-if="loading"
      variant="table"
      :rows="pagination.limit.value"
      :columns="5"
    />
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="loadExpenses">Coba lagi</UiButton>
    </ErrorState>
    <TableCard v-else title="Pengeluaran Kandang" description="Pengeluaran tersambung ke kandang dan kategori owner." icon="expenses">
      <table class="min-w-full text-left text-sm">
        <thead class="text-ink-500">
          <tr>
            <th class="pb-3 pr-4">Tanggal</th>
            <th class="pb-3 pr-4">Kandang</th>
            <th class="pb-3 pr-4">Kategori</th>
            <th class="pb-3 pr-4">Jumlah</th>
            <th class="pb-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in expenses" :key="item.id" class="border-t border-white/40">
            <td class="py-4 pr-4">{{ formatDate(item.date) }}</td>
            <td class="py-4 pr-4">{{ item.coopName }}</td>
            <td class="py-4 pr-4">{{ item.categoryLabel }}</td>
            <td class="py-4 pr-4 font-medium text-ink-900">{{ formatRupiah(item.amount) }}</td>
            <td class="py-4 text-right">
              <UiButton variant="ghost" size="sm" icon="edit" @click="dialogOpen = true; editing = item">Edit</UiButton>
              <UiButton variant="ghost" size="sm" icon="delete" @click="deleteDialogOpen = true; deleting = item">Hapus</UiButton>
            </td>
          </tr>
        </tbody>
      </table>
      <TablePagination
        :page="pagination.page.value"
        :limit="pagination.limit.value"
        :all="pagination.all.value"
        :total="pagination.total.value"
        :total-pages="pagination.totalPages.value"
        :has-next-page="pagination.hasNextPage.value"
        :has-prev-page="pagination.hasPrevPage.value"
        :loading="loading"
        @update:page="onPageChange"
        @update:limit="onLimitChange"
        @update:all="onAllChange"
      />
    </TableCard>

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
