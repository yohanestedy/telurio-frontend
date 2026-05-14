<script setup lang="ts">
import type { CoopItem, ExpenseCategoryItem, ExpenseItem, UserItem } from '../types/domain'
import { defaultPageSizeOptions } from '../utils/list'
import { formatAmountNumber } from '../utils/expense-helpers'
import { useApi } from '../composables/useApi'
import { useListPageActions } from '../composables/useListPageActions'
import { useIdempotentCreateDialog } from '../composables/useIdempotentCreateDialog'

definePageMeta({
  title: 'Expenses',
  roles: ['ADMIN', 'OWNER'],
})

const api = useApi()
const toast = useToast()
const auth = useAuthStore()
const route = useRoute()
const pagination = usePagination()
const { t } = useI18n()

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
const categoryModalOpen = ref(false)
const summaryReloadKey = ref(0)

const coopFilter = ref('')
const ownerFilter = ref('')
const categoryFilter = ref('')
const startDateFilter = ref('')
const endDateFilter = ref('')
const sortBy = ref('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = computed(() => [
  { label: t('expense.date'), value: 'date', kind: 'date' as const },
  { label: t('common.createdAt'), value: 'createdAt', kind: 'date' as const },
  { label: t('common.amount'), value: 'amount', kind: 'number' as const },
  // categoryLabel removed
])
const pageSizeOptions: number[] = [...defaultPageSizeOptions]
const skeletonCells = [
  { lines: [{ class: 'w-24' }] },
  { lines: [{ class: 'w-10/12' }] },
  { lines: [{ class: 'w-8/12' }] },
  { lines: [{ class: 'w-11/12' }] },
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

async function reloadCategories() {
  try {
    categories.value = await api.get<ExpenseCategoryItem[]>('/expense-categories')
  } catch { /* non-critical */ }
}

async function createCategory(payload: { name: string }) {
  try {
    await api.post('/expense-categories', { name: payload.name })
    toast.success(t('toast.expenseCategory.created'))
    await reloadCategories()
  } catch (caught) {
    toast.error(t('toast.expenseCategory.saveFailed'), api.mapError(caught).message)
  }
}

async function updateCategory(payload: { id: string; name: string; isActive: boolean }) {
  try {
    await api.patch(`/expense-categories/${payload.id}`, { name: payload.name, isActive: payload.isActive })
    toast.success(t('toast.expenseCategory.updated'))
    await reloadCategories()
  } catch (caught) {
    toast.error(t('toast.expenseCategory.saveFailed'), api.mapError(caught).message)
  }
}

async function deleteCategory(payload: { id: string }) {
  try {
    await api.delete(`/expense-categories/${payload.id}`, {})
    toast.success(t('toast.expenseCategory.deleted'))
    await reloadCategories()
  } catch (caught) {
    toast.error(api.mapError(caught).message)
  }
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

const {
  openCreateDialog,
  openEditDialog,
  getOrCreateIdempotencyKey,
  clearIdempotencyKey,
} = useIdempotentCreateDialog(dialogOpen, editing)

async function submitExpense(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/expenses/${editing.value.id}`, {
        date: payload.date,
        expenseCategoryId: payload.expenseCategoryId,
        description: payload.description,
        amount: payload.amount,
        notes: payload.notes,
      })
      toast.success(t('toast.expense.updated'))
    } else {
      const idempotencyKey = getOrCreateIdempotencyKey()
      await api.post('/expenses', { ...payload, idempotencyKey })
      toast.success(t('toast.expense.created'))
    }
    dialogOpen.value = false
    editing.value = null
    clearIdempotencyKey()
    await loadExpenses()
    summaryReloadKey.value += 1
  } catch (caught) {
    toast.error(t('toast.expense.saveFailed'), api.mapError(caught).message)
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
    toast.success(t('toast.expense.deleted'))
    deleteDialogOpen.value = false
    deleting.value = null
    await loadExpenses()
    summaryReloadKey.value += 1
  } catch (caught) {
    toast.error(t('toast.expense.deleteFailed'), api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

const { resetFilters, applyFilters, onPageChange, onLimitChange } = useListPageActions({
  loading,
  sortBy,
  sortOrder,
  resetPage: pagination.resetPage,
  setPage: pagination.setPage,
  setLimit: pagination.setLimit,
  load: loadExpenses,
  applyDrafts,
  resetActive,
})

async function consumeCreateQuery(value: unknown) {
  if (value !== 'new') {
    return
  }

  openCreateDialog()

  const nextQuery = { ...route.query }
  delete nextQuery.create
  await navigateTo({ path: route.path, query: nextQuery }, { replace: true })
}

onMounted(async () => {
  await Promise.all([loadSupporting(), loadExpenses()])
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
      icon="expenses"
      :title="t('expense.title')"
      :description="t('expense.description')"
    >
      <template #actions>
        <UiButton
          variant="ghost"
          icon="refresh"
          :title="t('common.refresh')"
          :aria-label="t('common.refresh')"
          @click="loadExpenses"
        />
        <UiButton
          variant="ghost"
          icon="categories"
          @click="categoryModalOpen = true"
        >
          {{ t('expenseCategory.manage') }}
        </UiButton>
        
        <UiButton icon="plus" @click="openCreateDialog">{{ t('common.add') }}</UiButton>
      </template>
    </ListHeaderCard>

    <ExpenseSummaryCard
      :key="summaryReloadKey"
      api-path="/expenses/summary"
      :title="t('expenseSummary.title')"
      filter-param="coopId"
      :filter-options="coopOptions"
      :filter-placeholder="t('stock.allCoops')"
    />

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
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">{{ t('common.sort') }}</p>
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
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">{{ t('common.dataFilter') }}</p>
          </div>

          <div class="space-y-3">
            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="coops" class="h-3.5 w-3.5 text-ink-500" />
                <span>{{ t('common.coop') }}</span>
              </p>
              <select
                :value="draftFilters.coopId"
                class="field-shell py-2.5"
                @change="draftFilters.coopId = ($event.target as HTMLSelectElement).value"
              >
                <option value="">{{ t('stock.allCoops') }}</option>
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
                <option value="">{{ t('expense.allOwners') }}</option>
                <option v-for="item in ownerOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>

            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="categories" class="h-3.5 w-3.5 text-ink-500" />
                <span>{{ t('expense.category') }}</span>
              </p>
              <select
                :value="draftFilters.expenseCategoryId"
                class="field-shell py-2.5"
                @change="draftFilters.expenseCategoryId = ($event.target as HTMLSelectElement).value"
              >
                <option value="">{{ t('expense.allCategories') }}</option>
                <option v-for="item in categoryFilterOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <UiDatePicker
                v-model="draftFilters.startDate"
                :label="t('date.start')"
                :placeholder="t('date.pickStart')"
              />
              <UiDatePicker
                v-model="draftFilters.endDate"
                :label="t('date.end')"
                :placeholder="t('date.pickEnd')"
              />
            </div>
          </div>

          <div class="mt-3 flex items-center justify-end gap-2 border-t border-slate-200/80 pt-3">
            <UiButton size="sm" variant="ghost" icon="refresh" @click="resetFilters">
              {{ t('common.reset') }}
            </UiButton>
            <UiButton size="sm" icon="filter" @click="applyFilters">
              {{ t('common.apply') }}
            </UiButton>
          </div>
      </template>

      <template #default>
        <table class="min-w-full text-left text-sm">
          <thead class="sticky top-0 z-10 bg-white/90 text-ink-500 backdrop-blur-sm">
            <tr>
              <th class="px-4 py-3 pr-4">{{ t('common.date') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('expense.itemDescription') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('expense.category') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('common.amountRp') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('common.coop') }}</th>
              <th class="px-4 py-3 pr-4 text-right">{{ t('common.actions') }}</th>
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
            :colspan="6"
            :message="error"
            @retry="loadExpenses"
          />
          <tbody v-else-if="expenses.length">
            <tr v-for="item in expenses" :key="item.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4">{{ formatDate(item.date) }}</td>
              <td class="px-4 py-4 pr-4 text-ink-700">{{ item.description || '-' }}</td>
              <td class="px-4 py-4 pr-4">
                <UiBadge v-if="item.expenseCategoryName" tone="neutral">{{ item.expenseCategoryName }}</UiBadge>
                <span v-else class="text-ink-300">—</span>
              </td>
              <td class="px-4 py-4 pr-4 font-medium text-ink-900">{{ formatAmountNumber(item.amount) }}</td>
              <td class="px-4 py-4 pr-4">{{ item.coopName }}</td>
              <td class="px-4 py-4 text-right">
                <div class="flex justify-end gap-1">
                  <UiButton variant="ghost" size="sm" icon="edit" @click="openEditDialog(item)">
                    {{ t('common.edit') }}
                  </UiButton>
                  <UiButton variant="ghost" size="sm" icon="delete" @click="deleteDialogOpen = true; deleting = item">
                    {{ t('common.delete') }}
                  </UiButton>
                </div>
              </td>
            </tr>
          </tbody>
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="6"
            :message="t('expense.emptyFiltered')"
          />
        </table>
      </template>
    </ListTableShell>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? t('expense.dialogTitle.edit') : t('expense.dialogTitle.add')"
      :description="t('expense.dialogDescription')"
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
          description: editing.description ?? '',
          amount: editing.amount,
          notes: editing.notes ?? '',
        } : undefined"
        @submit="submitExpense"
      />
    </UiDialog>

    <UiDialog
      v-model:open="deleteDialogOpen"
      :title="t('expense.deleteTitle')"
      :description="t('expense.deleteDescription')"
    >
      <FormsDeleteReasonForm :submitting="submitting" @submit="deleteExpense" />
    </UiDialog>

    <CategoryManageModal
      v-model:open="categoryModalOpen"
      :title="t('expenseCategory.manage')"
      :categories="categories"
      :show-owner="auth.role === 'ADMIN'"
      @create="createCategory"
      @update="updateCategory"
      @delete="deleteCategory"
      @refresh="reloadCategories"
    />
  </div>
</template>
