<script setup lang="ts">
import type {
  AllocationItem,
  CoopItem,
  LiveStockResponse,
  OrderItem,
  PaymentHistoryItem,
} from '../../types/domain'
import { deliveryStatusLabel, isoDate, paymentStatusLabel } from '../../utils/formatters'

definePageMeta({
  title: 'Order Detail',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
})

const route = useRoute()
const api = useApi()
const toast = useToast()
const auth = useAuthStore()
const { can } = useAuth()
const { t } = useI18n()
const { currentPrice, loadTodayPriceStatus } = useTodayPriceStatus()

const loading = ref(true)
const error = ref('')
const order = ref<OrderItem | null>(null)
const allocations = ref<AllocationItem[]>([])
const paymentHistory = ref<PaymentHistoryItem[]>([])
const activeTab = ref<'summary' | 'allocations' | 'payments'>('summary')
const startDeliveryOpen = ref(false)
const allocationModalMode = ref<'start' | 'edit'>('start')
const allocationModalLoading = ref(false)
const paymentOpen = ref(false)
const cancelOpen = ref(false)
const coops = ref<CoopItem[]>([])
const liveStock = ref<LiveStockResponse | null>(null)
const submitting = ref(false)

async function consumeOpenQuery(value: unknown) {
  if (!order.value) {
    return
  }

  const openTarget = String(value || '')
  if (!openTarget) {
    return
  }

  if (
    openTarget === 'start-delivery' &&
    auth.role === 'OPERATOR' &&
    order.value.lifecycleStatus === 'ACTIVE' &&
    order.value.deliveryStatus === 'BELUM_DIHANTAR'
  ) {
    await openAllocationModal('start')
  }

  if (
    openTarget === 'edit-allocation' &&
    auth.role === 'OPERATOR' &&
    order.value.lifecycleStatus === 'ACTIVE' &&
    order.value.deliveryStatus === 'SEDANG_DIHANTAR'
  ) {
    await openAllocationModal('edit')
  }

  if (
    openTarget === 'payment-update' &&
    can('orders.pay') &&
    order.value.paymentStatus !== 'LUNAS'
  ) {
    paymentOpen.value = true
  }

  const nextQuery = { ...route.query }
  delete nextQuery.open
  await navigateTo({ path: route.path, query: nextQuery }, { replace: true })
}

const coopOptions = computed(() =>
  coops.value.map((item) => ({ label: item.name, value: item.id })),
)

const isTodayDelivery = computed(() => {
  if (!order.value) {
    return false
  }

  return isoDate(order.value.deliveryDate) === isoDate(new Date())
})

const allocationDialogTitle = computed(() =>
  allocationModalMode.value === 'edit' ? t('dialog.allocation.editTitle') : t('dialog.allocation.startTitle'),
)

const allocationDialogDescription = computed(() =>
  allocationModalMode.value === 'edit'
    ? t('dialog.allocation.editDescription')
    : t('dialog.allocation.startDescription'),
)

async function loadOrder() {
  loading.value = true
  error.value = ''
  try {
    const [orderDetail, allocationList, paymentList, coopList, stock] = await Promise.all([
      api.get<OrderItem>(`/orders/${route.params.id}`),
      api.get<AllocationItem[]>(`/orders/${route.params.id}/allocations`),
      api.get<PaymentHistoryItem[]>(`/orders/${route.params.id}/payment-history`),
      api.getPage<CoopItem[]>('/coops', { all: true }),
      api.get<LiveStockResponse>('/stocks/live'),
      loadTodayPriceStatus(),
    ])

    order.value = orderDetail
    allocations.value = allocationList
    paymentHistory.value = paymentList
    coops.value = coopList.data
    liveStock.value = stock
    await consumeOpenQuery(route.query.open)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function openAllocationModal(mode: 'start' | 'edit') {
  if (!order.value) {
    return
  }

  allocationModalLoading.value = true

  try {
    const [orderDetail, allocationList, stock] = await Promise.all([
      api.get<OrderItem>(`/orders/${route.params.id}`),
      api.get<AllocationItem[]>(`/orders/${route.params.id}/allocations`),
      api.get<LiveStockResponse>('/stocks/live'),
      loadTodayPriceStatus(),
    ])

    order.value = orderDetail
    allocations.value = allocationList
    liveStock.value = stock
    allocationModalMode.value = mode
    startDeliveryOpen.value = true
  } catch (caught) {
    toast.error(t('toast.allocation.prepareFailed'), api.mapError(caught).message)
  } finally {
    allocationModalLoading.value = false
  }
}

async function submitDeliveryAllocation(payload: { allocations: Array<{ coopId: string; quantityKg: number }>; customPricePerKg?: number }) {
  submitting.value = true
  try {
    if (allocationModalMode.value === 'edit') {
      await api.patch(`/orders/${route.params.id}/allocations`, {
        allocations: payload.allocations,
      })
      toast.success(t('toast.allocation.updated'))
    } else {
      await api.post(`/orders/${route.params.id}/start-delivery`, payload)
      toast.success(t('toast.delivery.started'))
    }

    startDeliveryOpen.value = false
    await loadOrder()
  } catch (caught) {
    toast.error(
      allocationModalMode.value === 'edit'
        ? t('toast.allocation.updateFailed')
        : t('toast.delivery.startFailed'),
      api.mapError(caught).message,
    )
  } finally {
    submitting.value = false
  }
}

async function completeDelivery() {
  submitting.value = true
  try {
    await api.post(`/orders/${route.params.id}/complete-delivery`)
    toast.success(t('toast.delivery.completed'))
    await loadOrder()
  } catch (caught) {
    toast.error(t('toast.delivery.completeFailed'), api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function updatePayment(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    await api.post(`/orders/${route.params.id}/payment-updates`, payload)
    toast.success(t('toast.payment.updated'))
    paymentOpen.value = false
    await loadOrder()
  } catch (caught) {
    toast.error(t('toast.payment.updateFailed'), api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function cancelOrder(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    await api.post(`/orders/${route.params.id}/cancel`, payload)
    toast.success(t('toast.order.cancelled'))
    cancelOpen.value = false
    await loadOrder()
  } catch (caught) {
    toast.error(t('toast.order.cancelFailed'), api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

onMounted(loadOrder)

watch(
  () => route.query.open,
  (value) => {
    if (!value || !order.value) {
      return
    }

    void consumeOpenQuery(value)
  },
)
</script>

<template>
  <div class="space-y-6">
    <LoadingSkeleton v-if="loading" :lines="10" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="loadOrder">{{ t('common.retry') }}</UiButton>
    </ErrorState>
    <template v-else-if="order">
      <GlassCard>
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">{{ t('page.title.Orders') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-ink-900">{{ order.customer.name }}</h2>
            <p class="mt-2 text-sm text-ink-600">
              {{ formatKg(order.quantityKg) }} kg • {{ formatDate(order.deliveryDate) }} • {{ t('common.createdBy', { name: order.createdByName || '-' }) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UiButton
              v-if="auth.role === 'OPERATOR' && order.lifecycleStatus === 'ACTIVE' && order.deliveryStatus === 'BELUM_DIHANTAR'"
              icon="package"
              @click="openAllocationModal('start')"
            >
              {{ t('order.action.startDelivery') }}
            </UiButton>
            <UiButton
              v-if="auth.role === 'OPERATOR' && order.lifecycleStatus === 'ACTIVE' && order.deliveryStatus === 'SEDANG_DIHANTAR'"
              variant="secondary"
              icon="edit"
              @click="openAllocationModal('edit')"
            >
              {{ t('order.action.editAllocation') }}
            </UiButton>
            <UiButton
              v-if="auth.role === 'OPERATOR' && order.deliveryStatus === 'SEDANG_DIHANTAR'"
              variant="secondary"
              icon="chevronRight"
              @click="completeDelivery"
            >
              {{ t('order.action.completeDelivery') }}
            </UiButton>
            <UiButton
              v-if="can('orders.pay') && order.paymentStatus !== 'LUNAS'"
              variant="secondary"
              icon="money"
              @click="paymentOpen = true"
            >
              {{ t('order.action.updatePayment') }}
            </UiButton>
            <UiButton
              v-if="can('orders.cancel') && order.lifecycleStatus === 'ACTIVE' && order.deliveryStatus === 'BELUM_DIHANTAR'"
              variant="destructive"
              icon="delete"
              @click="cancelOpen = true"
            >
              {{ t('order.action.cancel') }}
            </UiButton>
          </div>
        </div>
      </GlassCard>

      <div class="flex flex-wrap gap-2">
        <UiButton :variant="activeTab === 'summary' ? 'primary' : 'secondary'" icon="dashboard" @click="activeTab = 'summary'">{{ t('order.summary') }}</UiButton>
        <UiButton :variant="activeTab === 'allocations' ? 'primary' : 'secondary'" icon="package" @click="activeTab = 'allocations'">{{ t('order.sourceAllocations') }}</UiButton>
        <UiButton :variant="activeTab === 'payments' ? 'primary' : 'secondary'" icon="money" @click="activeTab = 'payments'">{{ t('order.paymentHistory') }}</UiButton>
      </div>

      <TableCard v-if="activeTab === 'summary'" :title="t('order.summary')" :description="t('order.summaryDescription')" icon="orders">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard :label="t('order.delivery')" :value="deliveryStatusLabel(order.deliveryStatus)" icon="package" />
          <MetricCard :label="t('order.payment')" :value="paymentStatusLabel(order.paymentStatus)" icon="money" />
          <MetricCard
            :label="t('order.pricePerKg')"
            :value="formatRupiah(order.pricePerKg)"
            :helper="order.priceSource === 'CUSTOM' ? t('order.priceCustom') : ''"
            icon="prices"
          />
          <MetricCard
            label="Total invoice"
            :value="formatRupiah(order.totalInvoice)"
            icon="money"
          />
        </div>
        <div class="mt-6 rounded-2xl border border-white/40 bg-white/60 p-4 text-sm text-ink-700">
          <p><span class="font-medium text-ink-900">{{ t('order.deliverBefore') }}:</span> {{ order.deliverBefore || '-' }}</p>
          <p class="mt-2"><span class="font-medium text-ink-900">{{ t('common.notes') }}:</span> {{ order.notes || '-' }}</p>
        </div>
      </TableCard>

      <TableCard
        v-else-if="activeTab === 'allocations'"
        :title="t('order.sourceAllocations')"
        :description="t('order.sourceAllocationsDescription')"
        icon="package"
      >
        <div v-if="allocations.length" class="space-y-3 text-sm">
          <div
            v-for="item in allocations"
            :key="item.id"
            class="rounded-2xl border border-white/40 bg-white/60 px-4 py-4"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="font-medium text-ink-900">{{ item.coopName }}</span>
              <span>{{ formatKg(item.quantityKg) }} kg</span>
            </div>
            <p class="mt-2 text-xs text-ink-500">
              {{ t('common.inputByAt', { name: item.assignedByName || '-', date: formatDateTime(item.createdAt) }) }}
            </p>
          </div>
        </div>
        <p v-else class="text-sm text-ink-500">{{ t('order.noAllocations') }}</p>
      </TableCard>

      <TableCard
        v-else
        :title="t('order.paymentHistory')"
        :description="t('order.paymentHistoryDescription')"
        icon="money"
      >
        <div v-if="paymentHistory.length" class="space-y-3 text-sm">
          <div
            v-for="item in paymentHistory"
            :key="item.id"
            class="rounded-2xl border border-white/40 bg-white/60 px-4 py-4"
          >
            <div class="flex flex-wrap items-center gap-2">
              <StatusChip kind="payment" :value="item.paymentStatus" />
              <span>{{ item.paymentMethod || '-' }}</span>
              <span>{{ formatRupiah(item.amountPaid) }}</span>
            </div>
            <p class="mt-2 text-xs text-ink-500">
              {{ item.updatedByName || '-' }} • {{ formatDateTime(item.createdAt) }}
            </p>
            <p class="mt-1 text-sm text-ink-700">{{ item.notes || '-' }}</p>
          </div>
        </div>
        <p v-else class="text-sm text-ink-500">{{ t('order.noPaymentHistory') }}</p>
      </TableCard>

      <UiDialog
        v-model:open="startDeliveryOpen"
        :title="allocationDialogTitle"
        :description="allocationDialogDescription"
      >
        <LoadingSkeleton v-if="allocationModalLoading" :lines="6" />
        <FormsDeliveryAllocationForm
          v-else
          :coop-options="coopOptions"
          :order-quantity-kg="order.quantityKg"
          :order-price-per-kg="order.pricePerKg"
          :today-price-per-kg="currentPrice?.pricePerKg ?? null"
          :can-set-price-now="allocationModalMode === 'start' && isTodayDelivery"
          :enable-price-lock="allocationModalMode === 'start'"
          :initial-allocations="allocationModalMode === 'edit' ? allocations : []"
          :combined-available-kg="liveStock?.combinedAvailableKg ?? null"
          :coop-stocks="liveStock?.coops ?? []"
          :submit-label="allocationModalMode === 'edit' ? t('order.action.saveAllocation') : t('order.action.startDelivery')"
          :submitting="submitting"
          @submit="submitDeliveryAllocation"
        />
      </UiDialog>

      <UiDialog
        v-model:open="paymentOpen"
        :title="t('dialog.payment.title')"
        :description="t('dialog.payment.description')"
      >
        <FormsPaymentUpdateForm
          :submitting="submitting"
          :current-payment-status="order.paymentStatus"
          :total-invoice="order.totalInvoice"
          :dp-amount="order.dpAmount"
          @submit="updatePayment"
        />
      </UiDialog>

      <UiDialog
        v-model:open="cancelOpen"
        :title="t('order.cancel')"
        description="Pembatalan hanya berlaku untuk order aktif yang belum dihantar."
      >
        <FormsCancelOrderForm :submitting="submitting" @submit="cancelOrder" />
      </UiDialog>
    </template>
  </div>
</template>
