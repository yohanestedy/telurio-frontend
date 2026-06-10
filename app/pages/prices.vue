<script setup lang="ts">
import type { PriceItem } from '../types/domain'
import { defaultPageSizeOptions } from '../utils/list'
import { usePaginatedLoader } from '../composables/usePaginatedLoader'
import { useCreateQueryTrigger } from '../composables/useCreateQueryTrigger'
import { useInitialLoad } from '../composables/useInitialLoad'
import { useListPageController } from '../composables/useListPageController'

definePageMeta({
  title: 'Daily Prices',
  roles: ['ADMIN'],
})

const api = useApi()
const toast = useToast()
const pagination = usePagination()
const { t } = useI18n()

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

const orderByOptions = computed(() => [
  { label: t('form.price.effectiveDate'), value: 'effectiveDate', kind: 'date' as const },
  { label: t('common.createdAt'), value: 'createdAt', kind: 'date' as const },
  { label: t('form.price.pricePerKg'), value: 'pricePerKg', kind: 'number' as const },
])
const pageSizeOptions: number[] = [...defaultPageSizeOptions]
const skeletonCells = [
  { lines: [{ class: 'w-24' }] },
  { lines: [{ class: 'w-20' }] },
  { lines: [{ class: 'w-11/12' }] },
  { lines: [{ class: 'ml-auto w-20 rounded-xl' }] },
]

const { sortOrderOptions } = useListSort(sortBy, orderByOptions)
const pageRangeLabel = usePageRangeLabel(pagination)
const { currentPrice, todayPriceMissing, loadTodayPriceStatus } = useTodayPriceStatus()

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

const { load: loadPrices } = usePaginatedLoader<PriceItem[]>({
  loading,
  error,
  assignData: (data) => {
    prices.value = data
  },
  fetchPage: async () => {
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

    return list
  },
  applyMeta: (meta) => pagination.applyMeta(meta as any),
  mapError: api.mapError,
})

const { draftFilters, resetFilters, applyFilters, onPageChange, onLimitChange } = useListPageController({
  filters: {
    startDate: startDateFilter,
    endDate: endDateFilter,
  },
  loading,
  sortBy,
  sortOrder,
  resetPage: pagination.resetPage,
  setPage: pagination.setPage,
  setLimit: pagination.setLimit,
  load: loadPrices,
})

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
      toast.success(t('toast.price.updated'))
    } else {
      await api.post('/prices', payload)
      toast.success(t('toast.price.created'))
    }
    dialogOpen.value = false
    editing.value = null
    prefillTodayPrice.value = false
    await loadPrices()
  } catch (caught) {
    toast.error(t('toast.price.saveFailed'), api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

useCreateQueryTrigger({
  triggerValue: 'today',
  open: openTodayPriceDialog,
})

onMounted(async () => {
  await useInitialLoad([{ run: loadPrices }])
})

watch(dialogOpen, (isOpen) => {
  if (!isOpen) {
    editing.value = null
    prefillTodayPrice.value = false
  }
})

</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard
      icon="money"
      :title="t('price.listTitle')"
      :description="t('price.listDescription')"
      :align-actions-end="true"
    >
      <template #actions>
        <UiButton
          variant="secondary"
          icon="refresh"
          :title="t('common.refresh')"
          :aria-label="t('common.refresh')"
          @click="loadPrices"
        />
        <UiButton
          variant="ghost"
          icon="prices"
          :title="t('price.publishCustomer')"
          :aria-label="t('price.publishCustomer')"
          @click="navigateTo('/public/prices')"
        />
        <UiButton icon="plus" @click="openCreatePriceDialog">{{ t('common.add') }}</UiButton>
      </template>

      <MetricCard
        :label="t('price.active')"
        :value="currentPrice ? formatRupiah(currentPrice.pricePerKg) : '-'"
        :helper="currentPrice ? formatDate(currentPrice.effectiveDate) : t('price.todayUnavailable')"
        icon="prices"
      />
    </ListHeaderCard>

    <TodayPriceNotice
      v-if="todayPriceMissing"
      :title="t('notice.todayPriceMissing.title')"
      :message="t('price.todayMissingMessage')"
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
              <th class="px-4 py-3 pr-4">{{ t('price.price') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('common.notes') }}</th>
              <th class="px-4 py-3 pr-4 text-right">{{ t('common.actions') }}</th>
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
              <td class="px-4 py-4 pr-4 font-medium text-ink-900">{{ formatMoneyNumber(price.pricePerKg) }}</td>
              <td class="px-4 py-4 pr-4">{{ price.notes || '-' }}</td>
              <td class="px-4 py-4 text-right">
                <UiButton variant="ghost" size="sm" icon="edit" @click="dialogOpen = true; editing = price">
                  {{ t('common.edit') }}
                </UiButton>
              </td>
            </tr>
          </tbody>
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="4"
            :message="t('price.emptyFiltered')"
          />
        </table>
      </template>
    </ListTableShell>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? t('price.dialogTitle.edit') : t('price.dialogTitle.add')"

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
