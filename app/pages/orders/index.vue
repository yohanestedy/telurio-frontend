<script setup lang="ts">
import type { CustomerItem, OrderItem } from '../../types/domain'

definePageMeta({
  title: 'Orders',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
})

const api = useApi()
const toast = useToast()
const auth = useAuthStore()
const { can } = useAuth()
const pagination = usePagination()

const loading = ref(true)
const error = ref('')
const orders = ref<OrderItem[]>([])
const customers = ref<CustomerItem[]>([])
const dialogOpen = ref(false)
const editing = ref<OrderItem | null>(null)
const submitting = ref(false)

const deliveryStatus = ref('')
const paymentStatus = ref('')
const lifecycleStatus = ref('')

const customerOptions = computed(() =>
  customers.value.map((item) => ({ label: item.name, value: item.id })),
)

async function loadSupporting() {
  if (auth.role !== 'ADMIN') {
    return
  }
  const response = await api.getPage<CustomerItem[]>('/customers', { page: 1, limit: 100 })
  customers.value = response.data
}

async function loadOrders() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getPage<OrderItem[]>('/orders', {
      ...pagination.query.value,
      deliveryStatus: deliveryStatus.value || undefined,
      paymentStatus: paymentStatus.value || undefined,
      lifecycleStatus: lifecycleStatus.value || undefined,
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

onMounted(async () => {
  await Promise.all([loadSupporting(), loadOrders()])
})
</script>

<template>
  <div class="space-y-6">
    <FilterBar>
      <UiSelect
        v-model="deliveryStatus"
        label="Status delivery"
        placeholder="Semua"
        :options="deliveryStatuses.map((item) => ({ label: deliveryStatusLabel(item), value: item }))"
      />
      <UiSelect
        v-model="paymentStatus"
        label="Status pembayaran"
        placeholder="Semua"
        :options="paymentStatuses.map((item) => ({ label: paymentStatusLabel(item), value: item }))"
      />
      <UiSelect
        v-model="lifecycleStatus"
        label="Lifecycle"
        placeholder="Semua"
        :options="orderLifecycleStatuses.map((item) => ({ label: item, value: item }))"
      />
      <template #actions>
        <UiButton variant="secondary" @click="loadOrders">Refresh</UiButton>
        <UiButton v-if="can('orders.manage')" @click="dialogOpen = true; editing = null">Tambah order</UiButton>
      </template>
    </FilterBar>

    <LoadingSkeleton v-if="loading" :lines="8" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton @click="loadOrders">Coba lagi</UiButton>
    </ErrorState>
    <TableCard v-else title="Daftar Order" description="Delivery status dan payment status dipisah sesuai flow bisnis.">
      <table class="min-w-full text-left text-sm">
        <thead class="text-ink-500">
          <tr>
            <th class="pb-3 pr-4">Customer</th>
            <th class="pb-3 pr-4">Tanggal kirim</th>
            <th class="pb-3 pr-4">Kg</th>
            <th class="pb-3 pr-4">Delivery</th>
            <th class="pb-3 pr-4">Payment</th>
            <th class="pb-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id" class="border-t border-white/40">
            <td class="py-4 pr-4">
              <p class="font-medium text-ink-900">{{ order.customer.name }}</p>
              <p class="text-xs text-ink-500">{{ order.customer.phone || '-' }}</p>
            </td>
            <td class="py-4 pr-4">{{ formatDate(order.deliveryDate) }}</td>
            <td class="py-4 pr-4">{{ order.quantityKg }}</td>
            <td class="py-4 pr-4"><StatusChip kind="delivery" :value="order.deliveryStatus" /></td>
            <td class="py-4 pr-4"><StatusChip kind="payment" :value="order.paymentStatus" /></td>
            <td class="py-4 text-right">
              <UiButton
                variant="ghost"
                size="sm"
                @click="navigateTo({ path: `/orders/${order.id}`, query: { deliveryDate: order.deliveryDate } })"
              >
                Detail
              </UiButton>
              <UiButton
                v-if="can('orders.manage') && order.lifecycleStatus === 'ACTIVE' && order.deliveryStatus === 'BELUM_DIHANTAR'"
                variant="ghost"
                size="sm"
                @click="dialogOpen = true; editing = order"
              >
                Edit
              </UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </TableCard>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit order' : 'Tambah order'"
      description="Harga final akan dikunci saat delivery dimulai atau saat order langsung lunas."
      size="xl"
    >
      <OrderForm
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
