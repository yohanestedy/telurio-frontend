<script setup lang="ts">
import type {
  AllocationItem,
  CoopItem,
  OrderItem,
  PaymentHistoryItem,
} from '../../types/domain'
import { deliveryStatusLabel, paymentStatusLabel } from '../../utils/formatters'

definePageMeta({
  title: 'Order Detail',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
})

const route = useRoute()
const api = useApi()
const toast = useToast()
const auth = useAuthStore()
const { can } = useAuth()

const loading = ref(true)
const error = ref('')
const order = ref<OrderItem | null>(null)
const allocations = ref<AllocationItem[]>([])
const paymentHistory = ref<PaymentHistoryItem[]>([])
const activeTab = ref<'summary' | 'allocations' | 'payments'>('summary')
const startDeliveryOpen = ref(false)
const paymentOpen = ref(false)
const cancelOpen = ref(false)
const coops = ref<CoopItem[]>([])
const submitting = ref(false)

const coopOptions = computed(() =>
  coops.value.map((item) => ({ label: item.name, value: item.id })),
)

async function loadOrder() {
  loading.value = true
  error.value = ''
  try {
    const deliveryDate = typeof route.query.deliveryDate === 'string'
      ? route.query.deliveryDate
      : undefined

    const list = await api.getPage<OrderItem[]>('/orders', {
      page: 1,
      limit: 20,
      deliveryDate,
    })

    order.value = list.data.find((item) => item.id === route.params.id) ?? null

    if (!order.value) {
      throw new Error('Order tidak ditemukan pada scope data saat ini')
    }

    const [allocationList, paymentList, coopList] = await Promise.all([
      api.get<AllocationItem[]>(`/orders/${route.params.id}/allocations`),
      api.get<PaymentHistoryItem[]>(`/orders/${route.params.id}/payment-history`),
      api.getPage<CoopItem[]>('/coops', { page: 1, limit: 20 }),
    ])

    allocations.value = allocationList
    paymentHistory.value = paymentList
    coops.value = coopList.data
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function startDelivery(payload: { allocations: Array<{ coopId: string; quantityKg: number }> }) {
  submitting.value = true
  try {
    await api.post(`/orders/${route.params.id}/start-delivery`, payload)
    toast.success('Pengantaran berhasil dimulai')
    startDeliveryOpen.value = false
    await loadOrder()
  } catch (caught) {
    toast.error('Gagal memulai pengantaran', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function completeDelivery() {
  submitting.value = true
  try {
    await api.post(`/orders/${route.params.id}/complete-delivery`)
    toast.success('Pengantaran selesai')
    await loadOrder()
  } catch (caught) {
    toast.error('Gagal menyelesaikan pengantaran', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function updatePayment(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    await api.post(`/orders/${route.params.id}/payment-updates`, payload)
    toast.success('Pembayaran berhasil diperbarui')
    paymentOpen.value = false
    await loadOrder()
  } catch (caught) {
    toast.error('Gagal update pembayaran', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function cancelOrder(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    await api.post(`/orders/${route.params.id}/cancel`, payload)
    toast.success('Order berhasil dibatalkan')
    cancelOpen.value = false
    await loadOrder()
  } catch (caught) {
    toast.error('Gagal membatalkan order', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

onMounted(loadOrder)
</script>

<template>
  <div class="space-y-6">
    <LoadingSkeleton v-if="loading" :lines="10" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="loadOrder">Coba lagi</UiButton>
    </ErrorState>
    <template v-else-if="order">
      <GlassCard>
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Order</p>
            <h2 class="mt-2 text-2xl font-semibold text-ink-900">{{ order.customer.name }}</h2>
            <p class="mt-2 text-sm text-ink-600">
              {{ order.quantityKg }} kg • {{ formatDate(order.deliveryDate) }} • dibuat oleh {{ order.createdByName || '-' }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UiButton
              v-if="can('orders.deliver') && order.lifecycleStatus === 'ACTIVE' && order.deliveryStatus === 'BELUM_DIHANTAR'"
              icon="package"
              @click="startDeliveryOpen = true"
            >
              Start Delivery
            </UiButton>
            <UiButton
              v-if="auth.role === 'OPERATOR' && order.deliveryStatus === 'SEDANG_DIHANTAR'"
              variant="secondary"
              icon="chevronRight"
              @click="completeDelivery"
            >
              Complete Delivery
            </UiButton>
            <UiButton v-if="can('orders.pay')" variant="secondary" icon="money" @click="paymentOpen = true">
              Payment Update
            </UiButton>
            <UiButton
              v-if="can('orders.cancel') && order.lifecycleStatus === 'ACTIVE' && order.deliveryStatus === 'BELUM_DIHANTAR'"
              variant="destructive"
              icon="delete"
              @click="cancelOpen = true"
            >
              Cancel Order
            </UiButton>
          </div>
        </div>
      </GlassCard>

      <div class="flex flex-wrap gap-2">
        <UiButton :variant="activeTab === 'summary' ? 'primary' : 'secondary'" icon="dashboard" @click="activeTab = 'summary'">Summary</UiButton>
        <UiButton :variant="activeTab === 'allocations' ? 'primary' : 'secondary'" icon="package" @click="activeTab = 'allocations'">Allocations</UiButton>
        <UiButton :variant="activeTab === 'payments' ? 'primary' : 'secondary'" icon="money" @click="activeTab = 'payments'">Payment History</UiButton>
      </div>

      <TableCard v-if="activeTab === 'summary'" title="Ringkasan Order" description="Ikhtisar status delivery dan pembayaran." icon="orders">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Delivery" :value="deliveryStatusLabel(order.deliveryStatus)" icon="package" />
          <MetricCard label="Payment" :value="paymentStatusLabel(order.paymentStatus)" icon="money" />
          <MetricCard label="Harga/kg" :value="formatRupiah(order.pricePerKg)" icon="prices" />
          <MetricCard label="Total invoice" :value="formatRupiah(order.totalInvoice)" icon="wallet" />
        </div>
        <div class="mt-6 rounded-2xl border border-white/40 bg-white/60 p-4 text-sm text-ink-700">
          <p><span class="font-medium text-ink-900">Deliver before:</span> {{ order.deliverBefore || '-' }}</p>
          <p class="mt-2"><span class="font-medium text-ink-900">Catatan:</span> {{ order.notes || '-' }}</p>
        </div>
      </TableCard>

      <TableCard
        v-else-if="activeTab === 'allocations'"
        title="Source Allocations"
        description="Gross income per kandang berasal dari alokasi aktual ini."
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
              <span>{{ item.quantityKg }} kg</span>
            </div>
            <p class="mt-2 text-xs text-ink-500">
              Diinput oleh {{ item.assignedByName || '-' }} pada {{ formatDateTime(item.createdAt) }}
            </p>
          </div>
        </div>
        <p v-else class="text-sm text-ink-500">Belum ada alokasi sumber telur.</p>
      </TableCard>

      <TableCard
        v-else
        title="Payment History"
        description="Riwayat perubahan status pembayaran order."
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
        <p v-else class="text-sm text-ink-500">Belum ada riwayat pembayaran.</p>
      </TableCard>

      <UiDialog
        v-model:open="startDeliveryOpen"
        title="Start Delivery"
        description="Masukkan alokasi kandang hingga totalnya sama dengan quantity order."
      >
        <FormsDeliveryAllocationForm
          :coop-options="coopOptions"
          :order-quantity-kg="order.quantityKg"
          :submitting="submitting"
          @submit="startDelivery"
        />
      </UiDialog>

      <UiDialog
        v-model:open="paymentOpen"
        title="Payment Update"
        description="Semua update pembayaran akan masuk ke payment history."
      >
        <FormsPaymentUpdateForm :submitting="submitting" @submit="updatePayment" />
      </UiDialog>

      <UiDialog
        v-model:open="cancelOpen"
        title="Cancel Order"
        description="Pembatalan hanya berlaku untuk order aktif yang belum dihantar."
      >
        <FormsCancelOrderForm :submitting="submitting" @submit="cancelOrder" />
      </UiDialog>
    </template>
  </div>
</template>
