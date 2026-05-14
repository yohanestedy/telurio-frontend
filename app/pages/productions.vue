<script setup lang="ts">
import type { CoopItem, ProductionItem } from '../types/domain'
import { defaultPageSizeOptions } from '../utils/list'
import { useListPageActions } from '../composables/useListPageActions'

definePageMeta({
  title: 'Productions',
  roles: ['ADMIN', 'OPERATOR'],
})

const api = useApi()
const toast = useToast()
const auth = useAuthStore()
const route = useRoute()
const { can } = useAuth()
const pagination = usePagination()
const { t } = useI18n()

const loading = ref(true)
const error = ref('')
const productions = ref<ProductionItem[]>([])
const coops = ref<CoopItem[]>([])
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editing = ref<ProductionItem | null>(null)
const deleting = ref<ProductionItem | null>(null)
const submitting = ref(false)

const coopFilter = ref('')
const dateFilter = ref('')
const startDateFilter = ref('')
const endDateFilter = ref('')
const sortBy = ref('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = computed(() => [
  { label: t('production.productionDate'), value: 'date', kind: 'date' as const },
  { label: t('common.createdAt'), value: 'createdAt', kind: 'date' as const },
  { label: t('production.goodKg'), value: 'goodKg', kind: 'number' as const },
  { label: t('production.goodCount'), value: 'goodCount', kind: 'number' as const },
])
const pageSizeOptions: number[] = [...defaultPageSizeOptions]
const skeletonCells = [
  { lines: [{ class: 'w-24' }] },
  { lines: [{ class: 'w-10/12' }] },
  { lines: [{ class: 'w-16' }] },
  { lines: [{ class: 'w-16' }] },
  { lines: [{ class: 'w-16' }] },
  { lines: [{ class: 'ml-auto w-24 rounded-xl' }] },
]

const coopOptions = computed(() =>
  coops.value.map((item) => ({ label: item.name, value: item.id })),
)

const { sortOrderOptions } = useListSort(sortBy, orderByOptions)
const pageRangeLabel = usePageRangeLabel(pagination)
const { draftFilters, applyDrafts, resetActive } = useListFilterDrafts(
  {
    coopId: coopFilter,
    date: dateFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  },
  {
    apply: (draftValues, activeFilters) => {
      activeFilters.coopId.value = draftValues.coopId
      activeFilters.date.value = draftValues.date
      activeFilters.startDate.value = draftValues.date ? '' : draftValues.startDate
      activeFilters.endDate.value = draftValues.date ? '' : draftValues.endDate
    },
  },
)

async function loadSupporting() {
  const response = await api.getPage<CoopItem[]>('/coops', { all: true })
  coops.value = response.data
}

async function loadProductions() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getPage<ProductionItem[]>('/productions', {
      ...pagination.query.value,
      sortBy: sortBy.value,
      order: sortOrder.value,
      coopId: coopFilter.value || undefined,
      date: dateFilter.value || undefined,
      startDate: dateFilter.value ? undefined : startDateFilter.value || undefined,
      endDate: dateFilter.value ? undefined : endDateFilter.value || undefined,
    })
    productions.value = response.data
    pagination.applyMeta(response.meta)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function submitProduction(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/productions/${editing.value.id}`, payload)
      toast.success(t('toast.production.updated'))
    } else {
      await api.post('/productions', payload)
      toast.success(t('toast.production.created'))
    }
    dialogOpen.value = false
    editing.value = null
    await loadProductions()
  } catch (caught) {
    toast.error(t('toast.production.saveFailed'), api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function deleteProduction(payload: { deleteReason: string }) {
  if (!deleting.value) {
    return
  }

  submitting.value = true
  try {
    await api.delete(`/productions/${deleting.value.id}`, payload)
    toast.success(t('toast.production.deleted'))
    deleteDialogOpen.value = false
    deleting.value = null
    await loadProductions()
  } catch (caught) {
    toast.error(t('toast.production.deleteFailed'), api.mapError(caught).message)
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
  load: loadProductions,
  applyDrafts,
  resetActive,
})

async function consumeCreateQuery(value: unknown) {
  if (value !== 'new' || !can('productions.manage')) {
    return
  }

  dialogOpen.value = true
  editing.value = null

  const nextQuery = { ...route.query }
  delete nextQuery.create
  await navigateTo({ path: route.path, query: nextQuery }, { replace: true })
}

onMounted(async () => {
  await Promise.all([loadSupporting(), loadProductions()])
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
      icon="productions"
      :title="t('production.title')"
      :description="t('production.description')"
    >
      <template #actions>
        <UiButton
          variant="secondary"
          icon="refresh"
          :title="t('common.refresh')"
          :aria-label="t('common.refresh')"
          @click="loadProductions"
        />
        <UiButton
          v-if="can('productions.manage')"
          icon="plus"
          @click="dialogOpen = true; editing = null"
        >
          {{ t('common.add') }}
        </UiButton>
      </template>
    </ListHeaderCard>

    <ListTableShell
      :filter-applied="Boolean(coopFilter) || Boolean(dateFilter) || Boolean(startDateFilter) || Boolean(endDateFilter)"
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

            <UiDatePicker
              v-model="draftFilters.date"
              :label="t('production.specificDate')"
              :placeholder="t('date.placeholder')"
            />

            <div class="grid grid-cols-2 gap-2.5">
              <UiDatePicker
                v-model="draftFilters.startDate"
                :label="t('date.start')"
                :placeholder="t('date.pickStart')"
                :disabled="Boolean(draftFilters.date)"
              />
              <UiDatePicker
                v-model="draftFilters.endDate"
                :label="t('date.end')"
                :placeholder="t('date.pickEnd')"
                :disabled="Boolean(draftFilters.date)"
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
              <th class="px-4 py-3 pr-4">{{ t('common.coop') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('production.time') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('production.goodKg') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('common.amount') }}</th>
              <th class="px-4 py-3 pr-4 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <ListTableSkeletonBody
            v-if="loading"
            :rows="pagination.limit.value"
            row-key-prefix="productions-skeleton"
            :cells="skeletonCells"
          />
          <ListTableStateBody
            v-else-if="error"
            mode="error"
            :colspan="6"
            :message="error"
            @retry="loadProductions"
          />
          <tbody v-else-if="productions.length">
            <tr v-for="item in productions" :key="item.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4">{{ formatDate(item.date) }}</td>
              <td class="px-4 py-4 pr-4">{{ item.coopName }}</td>
              <td class="px-4 py-4 pr-4">{{ item.collectionTime }}</td>
              <td class="px-4 py-4 pr-4">{{ formatKg(item.goodKg) }}</td>
              <td class="px-4 py-4 pr-4">{{ item.goodCount }}</td>
              <td class="px-4 py-4 text-right">
                <div class="flex justify-end gap-1">
                  <UiButton
                    v-if="can('productions.manage') && auth.role === 'ADMIN'"
                    variant="ghost"
                    size="sm"
                    icon="edit"
                    @click="dialogOpen = true; editing = item"
                  >
                    {{ t('common.edit') }}
                  </UiButton>
                  <UiButton
                    v-if="can('productions.manage') && auth.role === 'ADMIN'"
                    variant="ghost"
                    size="sm"
                    icon="delete"
                    @click="deleteDialogOpen = true; deleting = item"
                  >
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
            :message="t('production.emptyFiltered')"
          />
        </table>
      </template>
    </ListTableShell>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? t('production.dialogTitle.edit') : t('production.dialogTitle.add')"
      :description="t('production.dialogDescription')"
    >
      <FormsProductionForm
        :coop-options="coopOptions"
        :submitting="submitting"
        :is-edit="Boolean(editing)"
        :initial-value="editing ? {
          date: isoDate(editing.date),
          coopId: editing.coopId,
          collectionTime: editing.collectionTime,
          goodKg: editing.goodKg,
          goodCount: String(editing.goodCount),
          brokenCount: String(editing.brokenCount ?? ''),
          notes: editing.notes ?? '',
        } : undefined"
        @submit="submitProduction"
      />
    </UiDialog>

    <UiDialog
      v-model:open="deleteDialogOpen"
      :title="t('production.deleteTitle')"
      :description="t('production.deleteDescription')"
    >
      <FormsDeleteReasonForm :submitting="submitting" @submit="deleteProduction" />
    </UiDialog>
  </div>
</template>
