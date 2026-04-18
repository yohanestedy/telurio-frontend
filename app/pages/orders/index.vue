<script setup lang="ts">
import { useListFilterDrafts } from '../../composables/useListFilterDrafts'
import type { CustomerItem, OrderItem } from '../../types/domain'
import { defaultPageSizeOptions } from '../../utils/list'
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
const pagination = usePagination()
const { todayPriceMissing, loadTodayPriceStatus } = useTodayPriceStatus()

const loading = ref(true)
const error = ref('')
const orders = ref<OrderItem[]>([])
const customers = ref<CustomerItem[]>([])
const dialogOpen = ref(false)
const editing = ref<OrderItem | null>(null)
const submitting = ref(false)
const latestOrderRequestId = ref(0)

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

const deliveryStatusOptions = deliveryStatuses.map((item) => ({
  label: deliveryStatusLabel(item),
  value: item,
}))

const paymentStatusOptions = paymentStatuses.map((item) => ({
  label: paymentStatusLabel(item),
  value: item,
}))

const orderByOptions = [
  { label: 'Tanggal kirim', value: 'deliveryDate', kind: 'date' as const },
  { label: 'Dibuat', value: 'createdAt', kind: 'date' as const },
  { label: 'Jumlah kg', value: 'quantityKg', kind: 'number' as const },
  { label: 'Status delivery', value: 'deliveryStatus', kind: 'text' as const },
  { label: 'Status payment', value: 'paymentStatus', kind: 'text' as const },
]
const pageSizeOptions: number[] = [...defaultPageSizeOptions]

const customerOptions = computed(() =>
  customers.value.map((item) => ({ label: item.name, value: item.id })),
)
const skeletonCells = [
  { lines: [{ class: 'w-11/12' }, { class: 'mt-2 w-7/12' }] },
  { lines: [{ class: 'w-9/12' }] },
  { lines: [{ class: 'w-7/12' }] },
  { lines: [{ class: 'w-24 rounded-full' }] },
  { lines: [{ class: 'w-24 rounded-full' }] },
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
  const response = await api.getPage<CustomerItem[]>('/customers', { all: true })
  customers.value = response.data
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

async function submitOrder(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/orders/${editing.value.id}`, payload)
      toast.success('Order berhasil diperbarui')
    } else {
      await api.post('/orders', payload)
      toast.success('Order berhasil dibuat')
    }
    dialogOpen.value = false
    editing.value = null
    await loadOrders()
  } catch (caught) {
    toast.error('Gagal menyimpan order', api.mapError(caught).message)
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

async function refreshOrdersContext() {
  await Promise.all([loadTodayPriceStatus(), loadOrders()])
}

async function consumeCreateQuery(value: unknown) {
  if (value !== 'new' || !can('orders.manage')) {
    return
  }

  dialogOpen.value = true
  editing.value = null

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

</script>

<template>
  <div class="space-y-4">
    <TodayPriceNotice
      v-if="todayPriceMissing"
      title="Harga telur hari ini belum diinput"
      :message="auth.role === 'ADMIN'
        ? 'Order dengan tanggal kirim hari ini belum bisa dibuat atau diproses pengantarannya sampai harga hari ini diinput.'
        : 'Order dengan tanggal kirim hari ini belum bisa diproses sampai admin menginput harga telur untuk hari ini.'"
      :show-action="auth.role === 'ADMIN'"
      @action="navigateTo({ path: '/prices', query: { create: 'today' } })"
    />

    <ListHeaderCard
      icon="orders"
      title="Daftar Order"
      description="Delivery status dan payment status dipisah sesuai flow bisnis."
    >
      <template #actions>
        <UiButton
          variant="secondary"
          icon="refresh"
          title="Refresh"
          aria-label="Refresh"
          @click="refreshOrdersContext"
        />
        <UiButton v-if="can('orders.manage')" icon="plus" @click="dialogOpen = true; editing = null">Tambah</UiButton>
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
                <UiIcon name="delivery" class="h-3.5 w-3.5 text-ink-500" />
                <span>Status Delivery</span>
              </p>
              <select
                :value="draftFilters.deliveryStatus"
                class="field-shell py-2.5"
                @change="draftFilters.deliveryStatus = ($event.target as HTMLSelectElement).value"
              >
                <option value="">Semua</option>
                <option v-for="item in deliveryStatusOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>

            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="money" class="h-3.5 w-3.5 text-ink-500" />
                <span>Status Pembayaran</span>
              </p>
              <select
                :value="draftFilters.paymentStatus"
                class="field-shell py-2.5"
                @change="draftFilters.paymentStatus = ($event.target as HTMLSelectElement).value"
              >
                <option value="">Semua</option>
                <option v-for="item in paymentStatusOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>

            <UiDatePicker
              v-model="draftFilters.deliveryDate"
              label="Tanggal kirim spesifik"
              placeholder="Pilih tanggal kirim"
            />

            <div class="grid gap-3 sm:grid-cols-2">
              <UiDatePicker
                v-model="draftFilters.startDate"
                label="Dari tanggal"
                placeholder="Pilih tanggal awal"
                :disabled="Boolean(draftFilters.deliveryDate)"
              />
              <UiDatePicker
                v-model="draftFilters.endDate"
                label="Sampai tanggal"
                placeholder="Pilih tanggal akhir"
                :disabled="Boolean(draftFilters.deliveryDate)"
              />
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
              <th class="px-4 py-3 pr-4">Customer</th>
              <th class="px-4 py-3 pr-4">Tanggal kirim</th>
              <th class="px-4 py-3 pr-4">Kg</th>
              <th class="px-4 py-3 pr-4">Delivery</th>
              <th class="px-4 py-3 pr-4">Payment</th>
              <th class="px-4 py-3 pr-4 text-right">Aksi</th>
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
            :colspan="6"
            :message="error"
            @retry="loadOrders"
          />
          <tbody v-else-if="orders.length">
            <tr v-for="order in orders" :key="order.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4">
                <p class="font-medium text-ink-900">{{ order.customer.name }}</p>
                <p class="text-xs text-ink-500">{{ order.customer.phone || '-' }}</p>
              </td>
              <td class="px-4 py-4 pr-4">{{ formatDate(order.deliveryDate) }}</td>
              <td class="px-4 py-4 pr-4">{{ order.quantityKg }}</td>
              <td class="px-4 py-4 pr-4"><StatusChip kind="delivery" :value="order.deliveryStatus" /></td>
              <td class="px-4 py-4 pr-4"><StatusChip kind="payment" :value="order.paymentStatus" /></td>
              <td class="px-4 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <UiButton
                    variant="ghost"
                    size="sm"
                    icon="search"
                    @click="navigateTo({ path: `/orders/${order.id}`, query: { deliveryDate: order.deliveryDate } })"
                  >
                    Detail
                  </UiButton>
                  <UiButton
                    v-if="can('orders.manage') && order.lifecycleStatus === 'ACTIVE' && order.deliveryStatus === 'BELUM_DIHANTAR'"
                    variant="ghost"
                    size="sm"
                    icon="edit"
                    @click="dialogOpen = true; editing = order"
                  >
                    Edit
                  </UiButton>
                </div>
              </td>
            </tr>
          </tbody>
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="6"
            message="Belum ada order untuk filter saat ini."
          />
        </table>
      </template>
    </ListTableShell>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit order' : 'Tambah order'"
      description="Harga final akan dikunci saat delivery dimulai atau saat order langsung lunas."
      size="xl"
    >
      <FormsOrderForm
        :is-edit="Boolean(editing)"
        :customer-options="customerOptions"
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
