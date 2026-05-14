<script setup lang="ts">
import { useListFilterDrafts } from '../../composables/useListFilterDrafts'
import type { CustomerItem, LiveStockResponse, OrderItem } from '../../types/domain'
import { defaultPageSizeOptions } from '../../utils/list'
import { generateIdempotencyKey } from '../../utils/idempotency'
import {
  deliveryStatuses,
  paymentStatuses,
} from '../../types/domain'
import { deliveryStatusLabel, paymentStatusLabel } from '../../utils/formatters'

definePageMeta({
  title: 'Orders',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
})

const api = useApi()
const toast = useToast()
const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const { can } = useAuth()
const { t } = useI18n()
const pagination = usePagination()
const { currentPrice, todayPriceMissing, loadTodayPriceStatus } = useTodayPriceStatus()

const loading = ref(true)
const error = ref('')
const orders = ref<OrderItem[]>([])
const customers = ref<CustomerItem[]>([])
const liveStock = ref<LiveStockResponse | null>(null)
const dialogOpen = ref(false)
const editing = ref<OrderItem | null>(null)
const submitting = ref(false)
const latestOrderRequestId = ref(0)
const createOrderIdempotencyKey = ref<string | null>(null)

const deliveryStatus = computed({
  get: () => ui.orderFilters.deliveryStatus,
  set: (value: string) => {
    ui.orderFilters.deliveryStatus = value
  },
})

const paymentStatus = computed({
  get: () => ui.orderFilters.paymentStatus,
  set: (value: string) => {
    ui.orderFilters.paymentStatus = value
  },
})

const deliveryDateFilter = computed({
  get: () => ui.orderFilters.deliveryDate,
  set: (value: string) => {
    ui.orderFilters.deliveryDate = value
  },
})

const startDateFilter = computed({
  get: () => ui.orderFilters.startDate,
  set: (value: string) => {
    ui.orderFilters.startDate = value
  },
})

const endDateFilter = computed({
  get: () => ui.orderFilters.endDate,
  set: (value: string) => {
    ui.orderFilters.endDate = value
  },
})

const sortBy = computed({
  get: () => ui.orderFilters.sortBy,
  set: (value: string) => {
    ui.orderFilters.sortBy = value
  },
})

const sortOrder = computed({
  get: () => ui.orderFilters.order,
  set: (value: 'asc' | 'desc') => {
    ui.orderFilters.order = value
  },
})

const deliveryStatusOptions = computed(() => deliveryStatuses.map((item) => ({
  label: deliveryStatusLabel(item),
  value: item,
})))

const paymentStatusOptions = computed(() => paymentStatuses.map((item) => ({
  label: paymentStatusLabel(item),
  value: item,
})))

const orderByOptions = computed(() => [
  { label: t('order.deliveryDate'), value: 'deliveryDate', kind: 'date' as const },
  { label: t('common.createdAt'), value: 'createdAt', kind: 'date' as const },
  { label: t('order.quantity'), value: 'quantityKg', kind: 'number' as const },
  { label: t('order.delivery'), value: 'deliveryStatus', kind: 'text' as const },
  { label: t('order.payment'), value: 'paymentStatus', kind: 'text' as const },
])
const pageSizeOptions: number[] = [...defaultPageSizeOptions]

const customerOptions = computed(() =>
  customers.value.map((item) => ({ label: item.name, value: item.id })),
)
const skeletonCells = [
  { lines: [{ class: 'w-11/12' }, { class: 'mt-2 w-7/12' }] },
  { lines: [{ class: 'w-9/12' }] },
  { lines: [{ class: 'w-14' }] },
  { lines: [{ class: 'w-24' }, { class: 'mt-2 w-20' }] },
  { lines: [{ class: 'w-20 rounded-full' }] },
  { lines: [{ class: 'w-20 rounded-full' }] },
  { lines: [{ class: 'ml-auto w-32 rounded-xl' }] },
]

const { sortOrderOptions } = useListSort(sortBy, orderByOptions)
const pageRangeLabel = usePageRangeLabel(pagination)
const { draftFilters, applyDrafts, resetActive } = useListFilterDrafts(
  {
    deliveryStatus,
    paymentStatus,
    deliveryDate: deliveryDateFilter,
    startDate: startDateFilter,
    endDate: endDateFilter,
  },
  {
    apply: (draftValues, activeFilters) => {
      activeFilters.deliveryStatus.value = draftValues.deliveryStatus
      activeFilters.paymentStatus.value = draftValues.paymentStatus
      activeFilters.deliveryDate.value = draftValues.deliveryDate
      activeFilters.startDate.value = draftValues.deliveryDate ? '' : draftValues.startDate
      activeFilters.endDate.value = draftValues.deliveryDate ? '' : draftValues.endDate
    },
  },
)

async function resetFilters() {
  resetActive()
  pagination.resetPage()
  await loadOrders()
}

async function applyFilters() {
  applyDrafts()
  pagination.resetPage()
  await loadOrders()
}

async function loadSupporting() {
  if (auth.role !== 'ADMIN') {
    return
  }

  const [customerResponse, stockResponse] = await Promise.all([
    api.getPage<CustomerItem[]>('/customers', { all: true }),
    api.get<LiveStockResponse>('/stocks/live'),
  ])

  customers.value = customerResponse.data
  liveStock.value = stockResponse
}

async function loadOrders() {
  const requestId = ++latestOrderRequestId.value
  loading.value = true
  error.value = ''

  // Ensure skeleton gets a paint frame even when the request resolves very fast.
  await nextTick()
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })

  try {
    const response = await api.getPage<OrderItem[]>('/orders', {
      ...pagination.query.value,
      sortBy: sortBy.value,
      order: sortOrder.value,
      deliveryStatus: deliveryStatus.value || undefined,
      paymentStatus: paymentStatus.value || undefined,
      deliveryDate: deliveryDateFilter.value || undefined,
      startDate: deliveryDateFilter.value ? undefined : startDateFilter.value || undefined,
      endDate: deliveryDateFilter.value ? undefined : endDateFilter.value || undefined,
    })
    if (requestId !== latestOrderRequestId.value) {
      return
    }

    orders.value = response.data
    pagination.applyMeta(response.meta)
  } catch (caught) {
    if (requestId !== latestOrderRequestId.value) {
      return
    }

    error.value = api.mapError(caught).message
  } finally {
    if (requestId === latestOrderRequestId.value) {
      loading.value = false
    }
  }
}

function openCreateDialog() {
  editing.value = null
  createOrderIdempotencyKey.value = generateIdempotencyKey()
  dialogOpen.value = true
}

function openEditDialog(order: OrderItem) {
  editing.value = order
  createOrderIdempotencyKey.value = null
  dialogOpen.value = true
}

async function submitOrder(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/orders/${editing.value.id}`, payload)
      toast.success(t('toast.order.updated'))
    } else {
      const idempotencyKey = createOrderIdempotencyKey.value ?? generateIdempotencyKey()
      createOrderIdempotencyKey.value = idempotencyKey
      await api.post('/orders', { ...payload, idempotencyKey })
      toast.success(t('toast.order.created'))
    }
    dialogOpen.value = false
    editing.value = null
    createOrderIdempotencyKey.value = null
    await loadOrders()
  } catch (caught) {
    toast.error(t('toast.order.saveFailed'), api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function onPageChange(nextPage: number) {
  pagination.setPage(nextPage)
  await loadOrders()
}

async function onLimitChange(nextLimit: number) {
  pagination.setLimit(nextLimit)
  await loadOrders()
}

function formatMoneyNumber(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  const normalized = Number(String(value).replace(/,/g, ''))
  if (Number.isNaN(normalized)) {
    return '-'
  }

  return normalized.toLocaleString(ui.language === 'en' ? 'en-US' : 'id-ID')
}

async function refreshOrdersContext() {
  await Promise.all([
    loadTodayPriceStatus(),
    loadOrders(),
    auth.role === 'ADMIN' ? loadSupporting() : Promise.resolve(),
  ])
}

async function consumeCreateQuery(value: unknown) {
  if (value !== 'new' || !can('orders.manage')) {
    return
  }

  dialogOpen.value = true
  editing.value = null
  createOrderIdempotencyKey.value = generateIdempotencyKey()

  const nextQuery = { ...route.query }
  delete nextQuery.create
  await navigateTo({ path: route.path, query: nextQuery }, { replace: true })
}

onMounted(async () => {
  await Promise.all([loadSupporting(), loadTodayPriceStatus(), loadOrders()])
})

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadOrders()
  }
})

watch(
  () => route.query.create,
  (value) => {
    consumeCreateQuery(value)
  },
  { immediate: true },
)

watch(dialogOpen, (open) => {
  if (!open) {
    editing.value = null
    createOrderIdempotencyKey.value = null
  }
})

</script>

<template>
  <div class="space-y-4">
    <TodayPriceNotice
      v-if="todayPriceMissing"
      :title="t('notice.todayPriceMissing.title')"
      :message="auth.role === 'ADMIN'
        ? t('notice.todayPriceMissing.admin')
        : t('notice.todayPriceMissing.user')"
      :show-action="auth.role === 'ADMIN'"
      @action="navigateTo({ path: '/prices', query: { create: 'today' } })"
    />

    <ListHeaderCard
      icon="orders"
      :title="t('order.listTitle')"
      :description="t('order.listDescription')"
    >
      <template #actions>
        <UiButton
          variant="secondary"
          icon="refresh"
          :title="t('common.refresh')"
          :aria-label="t('common.refresh')"
          @click="refreshOrdersContext"
        />
        <UiButton v-if="can('orders.manage')" icon="plus" @click="openCreateDialog">{{ t('common.add') }}</UiButton>
      </template>
    </ListHeaderCard>

    <ListTableShell
      :filter-applied="Boolean(deliveryStatus) || Boolean(paymentStatus) || Boolean(deliveryDateFilter) || Boolean(startDateFilter) || Boolean(endDateFilter)"
      :page-range-label="pageRangeLabel"
      :current-limit="pagination.limit.value"
      :page-size-options="[...pageSizeOptions]"
      :loading="loading"
      :has-prev-page="pagination.hasPrevPage.value"
      :has-next-page="pagination.hasNextPage.value"
      filter-menu-width-class="w-[min(92vw,22rem)]"
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
            <div class="grid grid-cols-2 gap-2.5">
              <div class="min-w-0 space-y-1.5">
                <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                  <UiIcon name="delivery" class="h-3.5 w-3.5 text-ink-500" />
                  <span>{{ t('order.delivery') }}</span>
                </p>
                <select
                  :value="draftFilters.deliveryStatus"
                  class="field-shell px-3 py-2.5"
                  @change="draftFilters.deliveryStatus = ($event.target as HTMLSelectElement).value"
                >
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="item in deliveryStatusOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>

              <div class="min-w-0 space-y-1.5">
                <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                  <UiIcon name="money" class="h-3.5 w-3.5 text-ink-500" />
                  <span>{{ t('order.payment') }}</span>
                </p>
                <select
                  :value="draftFilters.paymentStatus"
                  class="field-shell px-3 py-2.5"
                  @change="draftFilters.paymentStatus = ($event.target as HTMLSelectElement).value"
                >
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="item in paymentStatusOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>
            </div>

            <UiDatePicker
              v-model="draftFilters.deliveryDate"
              :label="t('order.deliveryDateSpecific')"
              :placeholder="t('order.pickDeliveryDate')"
            />

            <div class="grid grid-cols-2 gap-2.5">
              <UiDatePicker
                v-model="draftFilters.startDate"
                :label="t('date.start')"
                :placeholder="t('date.pickStart')"
                :disabled="Boolean(draftFilters.deliveryDate)"
              />
              <UiDatePicker
                v-model="draftFilters.endDate"
                :label="t('date.end')"
                :placeholder="t('date.pickEnd')"
                :disabled="Boolean(draftFilters.deliveryDate)"
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
              <th class="px-4 py-3 pr-4">{{ t('order.customerHeader') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('order.deliveryDate') }}</th>
              <th class="px-4 py-3 pr-4">Kg</th>
              <th class="px-4 py-3 pr-4">{{ t('order.totalRp') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('order.delivery') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('order.payment') }}</th>
              <th class="px-4 py-3 pr-4 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <ListTableSkeletonBody
            v-if="loading"
            :rows="pagination.limit.value"
            row-key-prefix="orders-skeleton"
            :cells="skeletonCells"
          />
          <ListTableStateBody
            v-else-if="error"
            mode="error"
            :colspan="7"
            :message="error"
            @retry="loadOrders"
          />
          <tbody v-else-if="orders.length">
            <tr v-for="order in orders" :key="order.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4">
                <p class="font-medium text-ink-900">{{ order.customer.name }}</p>
                <p class="text-[11px] text-ink-500">{{ order.customer.phone || '-' }}</p>
              </td>
              <td class="px-4 py-4 pr-4">{{ formatDate(order.deliveryDate) }}</td>
              <td class="whitespace-nowrap px-4 py-4 pr-4">{{ formatKg(order.quantityKg) }}</td>
              <td class="px-4 py-4 pr-4">
                <p class="font-medium text-ink-900">{{ formatMoneyNumber(order.totalInvoice) }}</p>
                <p class="text-[11px] leading-tight text-ink-500">
                  {{ order.pricePerKg ? `@ ${formatMoneyNumber(order.pricePerKg)} /kg` : t('order.priceNotLocked') }}
                </p>
              </td>
              <td class="whitespace-nowrap px-4 py-4 pr-4"><StatusChip compact kind="delivery" :value="order.deliveryStatus" /></td>
              <td class="whitespace-nowrap px-4 py-4 pr-4"><StatusChip compact kind="payment" :value="order.paymentStatus" /></td>
              <td class="px-4 py-4 text-right">
                <div class="flex justify-end gap-1">
                  <UiButton
                    variant="ghost"
                    size="sm"
                    icon="search"
                    :title="t('order.action.viewDetail')"
                    :aria-label="t('order.action.viewDetail')"
                    class="h-15 w-15 justify-center p-0"
                    @click="navigateTo({ path: `/orders/${order.id}`, query: { deliveryDate: order.deliveryDate } })"
                  />
                  <UiButton
                    v-if="can('orders.manage') && order.lifecycleStatus === 'ACTIVE' && order.deliveryStatus === 'BELUM_DIHANTAR'"
                    variant="ghost"
                    size="sm"
                    icon="edit"
                    :title="t('common.edit')"
                    :aria-label="t('common.edit')"
                    class="h-15 w-15 justify-center p-0"
                    @click="openEditDialog(order)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="7"
            :message="t('order.emptyFiltered')"
          />
        </table>
      </template>
    </ListTableShell>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? t('common.edit') : t('common.add')"
      description="Harga final akan dikunci saat delivery dimulai atau saat order langsung lunas."
      size="xl"
    >
      <FormsOrderForm
        :is-edit="Boolean(editing)"
        :customer-options="customerOptions"
        :today-price-per-kg="currentPrice?.pricePerKg ?? null"
        :combined-available-kg="liveStock?.combinedAvailableKg ?? null"
        :submitting="submitting"
        :initial-value="editing ? {
          customerId: editing.customer.id,
          quantityKg: editing.quantityKg,
          deliveryDate: isoDate(editing.deliveryDate),
          deliverBefore: editing.deliverBefore ?? '',
          notes: editing.notes ?? '',
        } : undefined"
        @submit="submitOrder"
      />
    </UiDialog>
  </div>
</template>
