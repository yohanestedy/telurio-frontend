<script setup lang="ts">
import { useApi } from '../composables/useApi'
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
import { useIdempotentCreateDialog } from '../composables/useIdempotentCreateDialog'
import { usePaginatedLoader } from '../composables/usePaginatedLoader'
import { useCoopOptions } from '../composables/useCoopOptions'
import { useInitialLoad } from '../composables/useInitialLoad'
import { useListPageController } from '../composables/useListPageController'

definePageMeta({
  title: 'Stocks',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
})

const api = useApi()
const toast = useToast()
const { can } = useAuth()
const pagination = usePagination()
const { t } = useI18n()

const loading = ref(true)
const error = ref('')
const movements = ref<StockMovementItem[]>([])
const manualAdjustOpen = ref(false)
const movementDetailOpen = ref(false)
const selectedMovement = ref<StockMovementItem | null>(null)
const submittingManualAdjust = ref(false)
const manualAdjustmentEditingPlaceholder = ref<null>(null)

const coopFilter = ref('')
const directionFilter = ref('')
const movementTypeFilter = ref('')
const startDateFilter = ref('')
const endDateFilter = ref('')
const sortBy = ref<'movementDate' | 'createdAt' | 'quantityKg' | 'movementType'>('movementDate')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = computed(() => [
  { label: t('stock.movementDate'), value: 'movementDate', kind: 'date' as const },
  { label: t('stock.recordedAt'), value: 'createdAt', kind: 'date' as const },
  { label: t('stock.quantityKg'), value: 'quantityKg', kind: 'number' as const },
  { label: t('stock.movementType'), value: 'movementType', kind: 'text' as const },
])
const pageSizeOptions: number[] = [...defaultPageSizeOptions]
const skeletonCells = [
  { lines: [{ class: 'w-24' }] },
  { lines: [{ class: 'w-10/12' }] },
  { lines: [{ class: 'w-40' }] },
  { lines: [{ class: 'w-16 rounded-full' }] },
  { lines: [{ class: 'w-16' }] },
  { lines: [{ class: 'w-24' }] },
  { lines: [{ class: 'w-32' }] },
  { lines: [{ class: 'w-20 rounded-xl' }] },
]

const directionOptions = computed(() => stockMovementDirections.map((item) => ({
  label: directionLabel(item),
  value: item,
})))
const movementTypeOptions = computed(() => stockMovementTypes.map((item) => ({
  label: movementTypeLabel(item),
  value: item,
})))
const { coopOptions, loadCoops } = useCoopOptions()

const { sortOrderOptions } = useListSort(sortBy, orderByOptions)
const pageRangeLabel = usePageRangeLabel(pagination)

const { load: loadMovements } = usePaginatedLoader<StockMovementItem[]>({
  loading,
  error,
  assignData: (data) => {
    movements.value = data
  },
  fetchPage: () =>
    api.getPage<StockMovementItem[]>('/stocks/movements', {
      ...pagination.query.value,
      sortBy: sortBy.value,
      order: sortOrder.value,
      coopId: coopFilter.value || undefined,
      direction: directionFilter.value || undefined,
      movementType: movementTypeFilter.value || undefined,
      startDate: startDateFilter.value || undefined,
      endDate: endDateFilter.value || undefined,
    }),
  applyMeta: (meta) => pagination.applyMeta(meta as any),
  mapError: api.mapError,
})

const { draftFilters, resetFilters, applyFilters, onPageChange, onLimitChange } = useListPageController({
  filters: {
    coopId: coopFilter,
    direction: directionFilter,
    movementType: movementTypeFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  },
  loading,
  sortBy,
  sortOrder,
  resetPage: pagination.resetPage,
  setPage: pagination.setPage,
  setLimit: pagination.setLimit,
  load: loadMovements,
})

async function refreshData() {
  await Promise.all([loadCoops(), loadMovements()])
}

const {
  openCreateDialog: openManualAdjustDialog,
  getOrCreateIdempotencyKey,
  clearIdempotencyKey,
} = useIdempotentCreateDialog(manualAdjustOpen, manualAdjustmentEditingPlaceholder)

function closeManualAdjustDialog() {
  manualAdjustOpen.value = false
  clearIdempotencyKey()
}

async function submitManualAdjustment(payload: {
  coopId: string
  direction: 'IN' | 'OUT'
  quantityKg: number
  notes?: string
}) {
  submittingManualAdjust.value = true

  try {
    const idempotencyKey = getOrCreateIdempotencyKey()
    await api.post('/stocks/manual-adjustments', { ...payload, idempotencyKey })
    toast.success(t('toast.stock.adjustmentSaved'))
    closeManualAdjustDialog()
    await refreshData()
  } catch (caught) {
    toast.error(t('toast.stock.adjustmentSaveFailed'), api.mapError(caught).message)
  } finally {
    submittingManualAdjust.value = false
  }
}

function openMovementDetail(item: StockMovementItem) {
  selectedMovement.value = item
  movementDetailOpen.value = true
}

async function openLinkedOrder() {
  const orderId = selectedMovement.value?.orderId
  if (!orderId) {
    return
  }

  movementDetailOpen.value = false
  await navigateTo(`/orders/${orderId}`)
}

function directionLabel(value: StockMovementDirection) {
  if (value === 'IN') {
    return t('stock.in')
  }

  return t('stock.out')
}

function movementTypeLabel(value: StockMovementType) {
  return t(`stock.type.${value}`)
}

function sourceLabel(value: StockMovementItem['sourceType']) {
  return t(`stock.source.${value}`)
}

onMounted(async () => {
  await useInitialLoad([
    { run: loadCoops },
    { run: loadMovements },
  ])
})

</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard
      icon="layers"
      :title="t('stock.listTitle')"
      :description="t('stock.listDescription')"
    >
      <template #actions>
        <UiButton
          v-if="can('stocks.manage')"
          icon="plus"
          @click="manualAdjustOpen = true"
        >
          {{ t('stock.addAdjustment') }}
        </UiButton>
        <UiButton
          variant="secondary"
          icon="refresh"
          :title="t('common.refresh')"
          :aria-label="t('common.refresh')"
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
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">{{ t('common.sort') }}</p>
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

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-1.5">
                <p class="text-xs font-medium text-ink-600">{{ t('stock.directionMovement') }}</p>
                <select
                  :value="draftFilters.direction"
                  class="field-shell py-2.5"
                  @change="draftFilters.direction = ($event.target as HTMLSelectElement).value"
                >
                  <option value="">{{ t('stock.allDirections') }}</option>
                  <option v-for="item in directionOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>
              <div class="space-y-1.5">
                <p class="text-xs font-medium text-ink-600">{{ t('stock.movementType') }}</p>
                <select
                  :value="draftFilters.movementType"
                  class="field-shell py-2.5"
                  @change="draftFilters.movementType = ($event.target as HTMLSelectElement).value"
                >
                  <option value="">{{ t('stock.allTypes') }}</option>
                  <option v-for="item in movementTypeOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>
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
              <th class="px-4 py-3 pr-4">{{ t('common.coop') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('common.type') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('stock.direction') }}</th>
              <th class="px-4 py-3 pr-4">Kg</th>
              <th class="px-4 py-3 pr-4">{{ t('common.source') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('common.recorded') }}</th>
              <th class="px-4 py-3 pr-4 text-right">{{ t('common.actions') }}</th>
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
            :colspan="8"
            :message="error"
            @retry="loadMovements"
          />
          <tbody v-else-if="movements.length">
            <tr v-for="item in movements" :key="item.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4">{{ formatDate(item.movementDate) }}</td>
              <td class="px-4 py-4 pr-4">{{ item.coopName }}</td>
              <td class="px-4 py-4 pr-4">{{ movementTypeLabel(item.movementType) }}</td>
              <td class="px-4 py-4 pr-4">
                <UiBadge :tone="item.direction === 'IN' ? 'success' : 'danger'">
                  {{ directionLabel(item.direction) }}
                </UiBadge>
              </td>
              <td class="px-4 py-4 pr-4">{{ formatKg(item.quantityKg) }}</td>
              <td class="px-4 py-4 pr-4">{{ sourceLabel(item.sourceType) }}</td>
              <td class="px-4 py-4 pr-4 text-xs text-ink-600">
                <p>{{ formatDateTime(item.createdAt) }}</p>
                <p>{{ item.createdByName || '-' }}</p>
              </td>
              <td class="px-4 py-4 pr-4 text-right">
                <UiButton
                  variant="ghost"
                  size="sm"
                  icon="search"
                  @click="openMovementDetail(item)"
                >
                  {{ t('common.detail') }}
                </UiButton>
              </td>
            </tr>
          </tbody>
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="8"
            :message="t('stock.emptyFiltered')"
          />
        </table>
      </template>
    </ListTableShell>

    <UiDialog
      v-model:open="manualAdjustOpen"
      :title="t('stock.adjustmentTitle')"
      :description="t('stock.adjustmentDescription')"
    >
      <FormsStockManualAdjustmentForm
        :coop-options="coopOptions"
        :submitting="submittingManualAdjust"
        @submit="submitManualAdjustment"
      />
    </UiDialog>

    <UiDialog
      v-model:open="movementDetailOpen"
      :title="t('stock.detailTitle')"
      :description="t('stock.detailDescription')"
      size="md"
    >
      <div v-if="selectedMovement" class="space-y-3 text-sm text-ink-700">
        <div class="grid gap-2 sm:grid-cols-2">
          <p><span class="font-medium text-ink-900">{{ t('common.coop') }}:</span> {{ selectedMovement.coopName }}</p>
          <p><span class="font-medium text-ink-900">{{ t('common.date') }}:</span> {{ formatDate(selectedMovement.movementDate) }}</p>
          <p><span class="font-medium text-ink-900">{{ t('stock.direction') }}:</span> {{ directionLabel(selectedMovement.direction) }}</p>
          <p><span class="font-medium text-ink-900">{{ t('common.type') }}:</span> {{ movementTypeLabel(selectedMovement.movementType) }}</p>
          <p><span class="font-medium text-ink-900">{{ t('order.quantity') }}:</span> {{ formatKg(selectedMovement.quantityKg) }} kg</p>
          <p><span class="font-medium text-ink-900">{{ t('common.source') }}:</span> {{ sourceLabel(selectedMovement.sourceType) }}</p>
          <p><span class="font-medium text-ink-900">Order ID:</span> {{ selectedMovement.orderId || '-' }}</p>
          <p><span class="font-medium text-ink-900">Source ID:</span> {{ selectedMovement.sourceId }}</p>
        </div>

        <div class="rounded-2xl border border-white/40 bg-white/60 p-3">
          <p class="font-medium text-ink-900">{{ t('common.notes') }}</p>
          <p class="mt-1 text-ink-700">{{ selectedMovement.notes || '-' }}</p>
        </div>

        <div class="rounded-2xl border border-white/40 bg-white/60 p-3 text-xs text-ink-600">
          <p>{{ t('common.recorded') }}: {{ formatDateTime(selectedMovement.createdAt) }}</p>
          <p>{{ t('common.by') }}: {{ selectedMovement.createdByName || '-' }}</p>
        </div>

        <div class="flex justify-end">
          <UiButton
            v-if="selectedMovement.orderId"
            variant="secondary"
            icon="orders"
            @click="openLinkedOrder"
          >
            {{ t('stock.openOrder') }}
          </UiButton>
        </div>
      </div>
    </UiDialog>
  </div>
</template>
