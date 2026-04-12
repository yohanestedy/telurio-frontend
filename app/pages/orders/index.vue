<script setup lang="ts">
import type { CustomerItem, OrderItem } from '../../types/domain'
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
const { can } = useAuth()
const pagination = usePagination()

const loading = ref(true)
const error = ref('')
const orders = ref<OrderItem[]>([])
const customers = ref<CustomerItem[]>([])
const dialogOpen = ref(false)
const editing = ref<OrderItem | null>(null)
const submitting = ref(false)

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
const draftDeliveryStatus = ref('')
const draftPaymentStatus = ref('')

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
const pageSizeOptions = [10, 25, 50, 100]

const customerOptions = computed(() =>
  customers.value.map((item) => ({ label: item.name, value: item.id })),
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

function clearDraftFilters() {
  draftDeliveryStatus.value = ''
  draftPaymentStatus.value = ''
}

async function resetFilters() {
  clearDraftFilters()
  deliveryStatus.value = ''
  paymentStatus.value = ''
  pagination.resetPage()
  await loadOrders()
}

async function applyFilters() {
  deliveryStatus.value = draftDeliveryStatus.value
  paymentStatus.value = draftPaymentStatus.value
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
  loading.value = true
  error.value = ''
  try {
    const response = await api.getPage<OrderItem[]>('/orders', {
      ...pagination.query.value,
      sortBy: sortBy.value,
      order: sortOrder.value,
      deliveryStatus: deliveryStatus.value || undefined,
      paymentStatus: paymentStatus.value || undefined,
    })
    orders.value = response.data
    pagination.applyMeta(response.meta)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
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

onMounted(async () => {
  draftDeliveryStatus.value = deliveryStatus.value
  draftPaymentStatus.value = paymentStatus.value
  await Promise.all([loadSupporting(), loadOrders()])
})

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadOrders()
  }
})

watch(
  [deliveryStatus, paymentStatus],
  ([nextDelivery, nextPayment]) => {
    draftDeliveryStatus.value = nextDelivery
    draftPaymentStatus.value = nextPayment
  },
)
</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard
      icon="orders"
      title="Daftar Order"
      description="Delivery status dan payment status dipisah sesuai flow bisnis."
    >
      <template #actions>
        <UiButton variant="secondary" icon="refresh" @click="loadOrders">Refresh</UiButton>
        <UiButton v-if="can('orders.manage')" icon="plus" @click="dialogOpen = true; editing = null">Tambah order</UiButton>
      </template>
    </ListHeaderCard>

    <ListTableShell
      :filter-applied="Boolean(deliveryStatus) || Boolean(paymentStatus)"
      :page-range-label="pageRangeLabel"
      :current-limit="pagination.limit.value"
      :page-size-options="pageSizeOptions"
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
                :value="draftDeliveryStatus"
                class="field-shell py-2.5"
                @change="draftDeliveryStatus = ($event.target as HTMLSelectElement).value"
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
                :value="draftPaymentStatus"
                class="field-shell py-2.5"
                @change="draftPaymentStatus = ($event.target as HTMLSelectElement).value"
              >
                <option value="">Semua</option>
                <option v-for="item in paymentStatusOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
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
          <tbody v-if="loading">
            <tr
              v-for="row in pagination.limit.value"
              :key="`orders-skeleton-${row}`"
              class="border-t border-slate-200/70"
            >
              <td class="px-4 py-4">
                <div class="h-4 w-11/12 animate-pulse rounded-md bg-slate-200/70" />
                <div class="mt-2 h-4 w-7/12 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-9/12 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-7/12 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-24 animate-pulse rounded-full bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-24 animate-pulse rounded-full bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="ml-auto h-4 w-32 animate-pulse rounded-xl bg-slate-200/70" />
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="error">
            <tr>
              <td colspan="6" class="px-4 py-14 text-center">
                <p class="text-sm text-rose-700">{{ error }}</p>
                <div class="mt-3 flex justify-center">
                  <UiButton size="sm" icon="refresh" @click="loadOrders">Coba lagi</UiButton>
                </div>
              </td>
            </tr>
          </tbody>
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
          <tbody v-else>
            <tr>
              <td colspan="6" class="px-4 py-14 text-center text-sm text-ink-500">
                Belum ada order untuk filter saat ini.
              </td>
            </tr>
          </tbody>
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
