<script setup lang="ts">
import type { GeneralExpenseCategoryItem, GeneralExpenseItem, UserItem } from '../types/domain'
import { defaultPageSizeOptions } from '../utils/list'
import { formatAmountNumber } from '../utils/expense-helpers'
import { generateIdempotencyKey } from '../utils/idempotency'
import { useApi } from '../composables/useApi'

definePageMeta({
  title: 'General Expenses',
  roles: ['ADMIN', 'OWNER'],
})

const api = useApi()
const toast = useToast()
const auth = useAuthStore()
const pagination = usePagination()
const { t } = useI18n()

const isAdmin = computed(() => auth.role === 'ADMIN')

const loading = ref(true)
const error = ref('')
const expenses = ref<GeneralExpenseItem[]>([])
const categories = ref<GeneralExpenseCategoryItem[]>([])
const owners = ref<UserItem[]>([])
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editing = ref<GeneralExpenseItem | null>(null)
const deleting = ref<GeneralExpenseItem | null>(null)
const submitting = ref(false)
const categoryModalOpen = ref(false)
const createGeneralExpenseIdempotencyKey = ref<string | null>(null)
const summaryReloadKey = ref(0)

const categoryFilter = ref('')
const startDateFilter = ref('')
const endDateFilter = ref('')
const sortBy = ref('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = computed(() => [
  { label: t('expense.date'), value: 'date', kind: 'date' as const },
  { label: t('common.createdAt'), value: 'createdAt', kind: 'date' as const },
  { label: t('common.amount'), value: 'amount', kind: 'number' as const },
])
const pageSizeOptions: number[] = [...defaultPageSizeOptions]
const skeletonCells = [
  { lines: [{ class: 'w-24' }] },
  { lines: [{ class: 'w-20' }] },
  { lines: [{ class: 'w-10/12' }] },
  { lines: [{ class: 'w-8/12' }] },
  { lines: [{ class: 'w-20' }] },
  { lines: [{ class: 'ml-auto w-24 rounded-xl' }] },
]

const categoryOptions = computed(() =>
  categories.value.map((item) => ({ label: item.name, value: item.id })),
)

const ownerOptions = computed(() =>
  owners.value.map((item) => ({ label: item.name, value: item.id })),
)

const { sortOrderOptions } = useListSort(sortBy, orderByOptions)
const pageRangeLabel = usePageRangeLabel(pagination)
const { draftFilters, applyDrafts, resetActive } = useListFilterDrafts({
  categoryId: categoryFilter,
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

async function loadCategories() {
  try {
    categories.value = await api.get<GeneralExpenseCategoryItem[]>('/general-expense-categories')
  } catch {
    // non-critical
  }
}

async function createCategory(payload: { name: string }) {
  try {
    await api.post('/general-expense-categories', { name: payload.name })
    toast.success(t('toast.expenseCategory.created'))
    await loadCategories()
  } catch (caught) {
    toast.error(t('toast.expenseCategory.saveFailed'), api.mapError(caught).message)
  }
}

async function updateCategory(payload: { id: string; name: string; isActive: boolean }) {
  try {
    await api.patch(`/general-expense-categories/${payload.id}`, { name: payload.name })
    toast.success(t('toast.expenseCategory.updated'))
    await loadCategories()
  } catch (caught) {
    toast.error(t('toast.expenseCategory.saveFailed'), api.mapError(caught).message)
  }
}

async function deleteCategory(payload: { id: string }) {
  try {
    await api.delete(`/general-expense-categories/${payload.id}`, {})
    toast.success(t('toast.expenseCategory.deleted'))
    await loadCategories()
  } catch (caught) {
    toast.error(api.mapError(caught).message)
  }
}

async function loadExpenses() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getPage<GeneralExpenseItem[]>('/general-expenses', {
      ...pagination.query.value,
      sortBy: sortBy.value,
      order: sortOrder.value,
      categoryId: categoryFilter.value || undefined,
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

function openCreateDialog() {
  editing.value = null
  createGeneralExpenseIdempotencyKey.value = generateIdempotencyKey()
  dialogOpen.value = true
}

function openEditDialog(expense: GeneralExpenseItem) {
  editing.value = expense
  createGeneralExpenseIdempotencyKey.value = null
  dialogOpen.value = true
}

async function submitExpense(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/general-expenses/${editing.value.id}`, payload)
      toast.success(t('toast.generalExpense.updated'))
    } else {
      const idempotencyKey = createGeneralExpenseIdempotencyKey.value ?? generateIdempotencyKey()
      createGeneralExpenseIdempotencyKey.value = idempotencyKey
      await api.post('/general-expenses', { ...payload, idempotencyKey })
      toast.success(t('toast.generalExpense.created'))
    }
    dialogOpen.value = false
    editing.value = null
    createGeneralExpenseIdempotencyKey.value = null
    await loadExpenses()
    summaryReloadKey.value += 1
  } catch (caught) {
    toast.error(t('toast.generalExpense.saveFailed'), api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function deleteExpense(payload: { deleteReason: string }) {
  if (!deleting.value) return
  submitting.value = true
  try {
    await api.delete(`/general-expenses/${deleting.value.id}`, payload)
    toast.success(t('toast.generalExpense.deleted'))
    deleteDialogOpen.value = false
    deleting.value = null
    await loadExpenses()
    summaryReloadKey.value += 1
  } catch (caught) {
    toast.error(t('toast.generalExpense.deleteFailed'), api.mapError(caught).message)
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

const route = useRoute()

async function consumeCreateQuery(value: unknown) {
  if (value !== 'new') return
  openCreateDialog()
  const nextQuery = { ...route.query }
  delete nextQuery.create
  await navigateTo({ path: route.path, query: nextQuery }, { replace: true })
}

async function loadOwners() {
  if (auth.role !== 'ADMIN') return
  try {
    const res = await api.getPage<UserItem[]>('/users', { all: true, role: 'OWNER' })
    owners.value = res.data
  } catch { /* non-critical */ }
}

onMounted(async () => {
  await Promise.all([loadExpenses(), loadCategories(), loadOwners()])
})

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadExpenses()
  }
})

watch(
  () => route.query.create,
  (value) => { consumeCreateQuery(value) },
  { immediate: true },
)

watch(dialogOpen, (open) => {
  if (!open) {
    createGeneralExpenseIdempotencyKey.value = null
  } else if (!editing.value && !createGeneralExpenseIdempotencyKey.value) {
    createGeneralExpenseIdempotencyKey.value = generateIdempotencyKey()
  }
})
</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard
      icon="wallet"
      :title="t('generalExpense.title')"
      :description="t('generalExpense.description')"
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
        
        <UiButton icon="plus" @click="openCreateDialog">
          {{ t('common.add') }}
        </UiButton>
      </template>
    </ListHeaderCard>

    <ExpenseSummaryCard
      :key="summaryReloadKey"
      api-path="/general-expenses/summary"
      :title="t('expenseSummary.title')"
      filter-param="ownerId"
      :filter-options="ownerOptions"
      :filter-placeholder="t('expense.allOwners')"
    />

    <ListTableShell
      :filter-applied="Boolean(categoryFilter) || Boolean(startDateFilter) || Boolean(endDateFilter)"
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
              <UiIcon name="categories" class="h-3.5 w-3.5 text-ink-500" />
              <span>{{ t('expense.category') }}</span>
            </p>
            <select
              :value="draftFilters.categoryId"
              class="field-shell py-2.5"
              @change="draftFilters.categoryId = ($event.target as HTMLSelectElement).value"
            >
              <option value="">{{ t('expense.allCategories') }}</option>
              <option v-for="item in categoryOptions" :key="item.value" :value="item.value">
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
              <th v-if="isAdmin" class="px-4 py-3 pr-4">Owner</th>
              <th class="px-4 py-3 pr-4">{{ t('expense.itemDescription') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('expense.category') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('common.amountRp') }}</th>
              <th class="px-4 py-3 pr-4 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <ListTableSkeletonBody
            v-if="loading"
            :rows="pagination.limit.value"
            row-key-prefix="general-expenses-skeleton"
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
              <td v-if="isAdmin" class="px-4 py-4 pr-4 text-ink-600">{{ item.ownerName ?? '-' }}</td>
              <td class="px-4 py-4 pr-4 text-ink-700">
                <div>{{ item.description }}</div>
                <div v-if="item.notes" class="mt-0.5 text-xs text-ink-400">{{ item.notes }}</div>
              </td>
              <td class="px-4 py-4 pr-4">
                <UiBadge v-if="item.categoryName" tone="neutral">{{ item.categoryName }}</UiBadge>
                <span v-else class="text-ink-300">—</span>
              </td>
              <td class="px-4 py-4 pr-4 font-medium text-ink-900">{{ formatAmountNumber(item.amount) }}</td>
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
            :message="t('generalExpense.empty')"
          />
        </table>
      </template>
    </ListTableShell>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? t('generalExpense.edit') : t('generalExpense.add')"
    >
      <GeneralExpenseForm
        :initial="editing"
        :categories="categories"
        :submitting="submitting"
        @submit="submitExpense"
        @cancel="dialogOpen = false"
      />
    </UiDialog>

    <UiDialog
      v-model:open="deleteDialogOpen"
      :title="t('generalExpense.deleteTitle')"
    >
      <FormsDeleteReasonForm :submitting="submitting" @submit="deleteExpense" />
    </UiDialog>

    <CategoryManageModal
      v-model:open="categoryModalOpen"
      :title="t('generalExpense.category.title')"
      :categories="categories"
      :show-owner="isAdmin"
      @create="createCategory"
      @update="updateCategory"
      @delete="deleteCategory"
      @refresh="loadCategories"
    />
  </div>
</template>
