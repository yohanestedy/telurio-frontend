<script setup lang="ts">
import type {
  CalendarDay,
  CustomerItem,
  ExpenseItem,
  GrossIncomeItem,
  LiveStockResponse,
  MonthlySummaryResponse,
  OrderItem,
  ProductionItem,
} from '../types/domain'

definePageMeta({
  title: 'Dashboard',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
})

const api = useApi()
const auth = useAuthStore()
const toast = useToast()
const { currentPrice, todayPriceMissing, loadTodayPriceStatus } = useTodayPriceStatus()

const loading = ref(true)
const error = ref('')
const todayOrders = ref<OrderItem[]>([])
const todayCalendar = ref<CalendarDay | null>(null)
const productions = ref<ProductionItem[]>([])
const expenses = ref<ExpenseItem[]>([])
const grossIncome = ref<GrossIncomeItem[]>([])
const liveStock = ref<LiveStockResponse | null>(null)
const monthlySummary = ref<MonthlySummaryResponse | null>(null)
const customers = ref<CustomerItem[]>([])
const createOrderOpen = ref(false)
const creatingOrder = ref(false)
const shareImageVersion = ref(Date.now())

async function loadDashboard() {
  loading.value = true
  error.value = ''

  try {
    const today = isoDate(new Date())
    const tasks: Array<Promise<unknown>> = [
      loadTodayPriceStatus(),
      api.get<OrderItem[]>('/orders', {
        deliveryDate: today,
        page: 1,
        limit: 5,
      } as never).then((value) => {
        todayOrders.value = value
      }),
      api.get<CalendarDay>(`/calendar/${today}`).then((value) => {
        todayCalendar.value = value
      }),
      api.get<GrossIncomeItem[]>('/reports/gross-income').then((value) => {
        grossIncome.value = value
      }),
      api.get<LiveStockResponse>('/stocks/live').then((value) => {
        liveStock.value = value
      }),
    ]

    if (auth.role === 'ADMIN') {
      tasks.push(
        api.getPage<CustomerItem[]>('/customers', { all: true }).then((value) => {
          customers.value = value.data
        }),
      )
    }

    if (auth.role === 'OPERATOR') {
      tasks.push(
        api.get<ProductionItem[]>('/productions', { page: 1, limit: 5 } as never).then((value) => {
          productions.value = value
        }),
      )
    }

    if (auth.role === 'ADMIN' || auth.role === 'OWNER') {
      tasks.push(
        api.get<ExpenseItem[]>('/expenses', { page: 1, limit: 5 } as never).then((value) => {
          expenses.value = value
        }),
      )
    }

    if (auth.role === 'OWNER') {
      tasks.push(
        api.get<MonthlySummaryResponse>('/reports/monthly-summary').then((value) => {
          monthlySummary.value = value
        }),
      )
    }

    await Promise.all(tasks)
    shareImageVersion.value = Date.now()
  } catch (caught) {
    error.value = useApi().mapError(caught).message
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)

const dashboardCards = computed(() => [
  {
    label: 'Stok Live Gabungan',
    value: `${formatKg(liveStock.value?.combinedAvailableKg ?? 0)} kg`,
    helper: `Masuk ${formatKg(liveStock.value?.combinedTodayInKg ?? 0)} kg • Keluar ${formatKg(liveStock.value?.combinedTodayOutKg ?? 0)} kg`,
  },
  {
    label: 'Harga Aktif',
    value: currentPrice.value ? formatRupiah(currentPrice.value.pricePerKg) : '-',
    helper: currentPrice.value ? formatDate(currentPrice.value.effectiveDate) : 'Harga hari ini belum diinput',
  },
  {
    label: 'Order Hari Ini',
    value: String(todayOrders.value.length),
    helper: 'Pesanan pada tanggal hari ini',
  },
  {
    label: auth.role === 'OWNER' ? 'Bagi Hasil Bulan Ini' : 'Gross Income',
    value:
      auth.role === 'OWNER' && monthlySummary.value
        ? formatRupiah(monthlySummary.value.totalOwnerShare)
        : formatRupiah(grossIncome.value.reduce((sum, item) => sum + Number(item.grossIncome), 0)),
    helper: 'Ringkasan cepat untuk monitoring',
  },
])

const customerOptions = computed(() =>
  customers.value.map((item) => ({ label: item.name, value: item.id })),
)

async function createOrder(payload: Record<string, unknown>) {
  creatingOrder.value = true
  try {
    await api.post('/orders', payload)
    toast.success('Order berhasil dibuat', 'Pesanan baru sudah masuk ke daftar order.')
    createOrderOpen.value = false
    await loadDashboard()
  } catch (caught) {
    toast.error('Gagal membuat order', api.mapError(caught).message)
  } finally {
    creatingOrder.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="grid gap-4 md:grid-cols-3">
      <LoadingSkeleton v-for="index in 3" :key="index" :lines="4" />
    </div>
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="loadDashboard">Coba lagi</UiButton>
    </ErrorState>
    <template v-else>
      <TodayPriceNotice
        v-if="todayPriceMissing"
        title="Harga telur hari ini belum diinput"
        :message="auth.role === 'ADMIN'
          ? 'Input harga untuk hari ini agar order dengan tanggal kirim hari ini bisa langsung mengunci harga dan siap diproses.'
          : 'Order dengan tanggal kirim hari ini akan tertahan sampai admin menginput harga telur untuk hari ini.'"
        :show-action="auth.role === 'ADMIN'"
        @action="navigateTo({ path: '/prices', query: { create: 'today' } })"
      />

      <div class="relative z-20 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          v-for="card in dashboardCards"
          :key="card.label"
          :label="card.label"
          :value="card.value"
          :helper="card.helper"
          :icon="card.label === 'Stok Live Gabungan'
            ? 'layers'
            : card.label === 'Harga Aktif'
              ? 'prices'
              : card.label === 'Order Hari Ini'
                ? 'orders'
                : 'reports'"
        >
          <template v-if="card.label === 'Harga Aktif'" #action>
            <PublicPriceShareMenu
              icon-only
              :effective-date="currentPrice?.effectiveDate ?? null"
              :image-version="shareImageVersion"
            />
          </template>
        </MetricCard>
      </div>

      <TableCard
        title="Live Stock Per Kandang"
        description="Stok aktif saat ini berdasarkan akses kandang user."
        icon="layers"
      >
        <div v-if="liveStock?.coops?.length" class="space-y-3">
          <div
            v-for="item in liveStock.coops"
            :key="item.coopId"
            class="rounded-2xl border border-white/40 bg-white/60 px-4 py-3 text-sm"
          >
            <div class="flex flex-wrap items-center justify-between gap-3 text-ink-900">
              <p class="font-semibold">{{ item.coopName }}</p>
              <p>{{ formatKg(item.availableKg) }} kg</p>
            </div>
            <p class="mt-2 text-xs text-ink-600">
              Masuk hari ini {{ formatKg(item.todayInKg) }} kg • Keluar hari ini {{ formatKg(item.todayOutKg) }} kg
            </p>
            <p class="mt-1 text-[11px] text-ink-500">
              Update terakhir {{ formatDateTime(item.updatedAt) }}
            </p>
          </div>
        </div>
        <p v-else class="text-sm text-ink-500">Belum ada stok kandang dalam scope akses Anda.</p>
      </TableCard>

      <div class="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <TableCard
          title="Agenda Hari Ini"
          description="Order, produksi, expense, dan perubahan harga yang jatuh hari ini."
          icon="calendar"
        >
          <div v-if="todayCalendar" class="space-y-5 text-sm text-ink-700">
            <div>
              <p class="font-semibold text-ink-900">Orders</p>
              <div v-if="todayCalendar.events.orders.length" class="mt-2 space-y-2">
                <div
                  v-for="order in todayCalendar.events.orders"
                  :key="order.orderId"
                  class="rounded-2xl border border-white/40 bg-white/60 px-4 py-3"
                >
                  <div class="flex items-center justify-between gap-3">
                    <span>{{ order.customerName }} • {{ formatKg(order.quantityKg) }} kg</span>
                    <StatusChip kind="payment" :value="order.paymentStatus" />
                  </div>
                </div>
              </div>
              <p v-else class="mt-2 text-ink-500">Belum ada order untuk hari ini.</p>
            </div>

            <div>
              <p class="font-semibold text-ink-900">Productions</p>
              <div v-if="todayCalendar.events.productions.length" class="mt-2 space-y-2">
                <div
                  v-for="item in todayCalendar.events.productions"
                  :key="item.coopId"
                  class="rounded-2xl border border-white/40 bg-white/60 px-4 py-3"
                >
                  {{ item.coopName }} • {{ formatKg(item.totalGoodKg) }} kg • {{ item.collectionCount }} pengambilan
                </div>
              </div>
              <p v-else class="mt-2 text-ink-500">Belum ada produksi tercatat.</p>
            </div>
          </div>
        </TableCard>

        <TableCard title="Prioritas Cepat" description="Arahkan tim ke halaman yang paling sering dipakai." icon="chevronRight">
          <div class="grid gap-3">
            <UiButton
              v-if="auth.role === 'ADMIN'"
              icon="plus"
              class="justify-start"
              @click="createOrderOpen = true"
            >
              Buat pesanan baru
            </UiButton>
            <NuxtLink
              to="/orders"
              class="rounded-2xl border border-white/40 bg-white/60 px-4 py-4 text-sm text-ink-700 transition hover:bg-white"
            >
              Buka daftar order aktif
            </NuxtLink>
            <NuxtLink
              to="/stocks"
              class="rounded-2xl border border-white/40 bg-white/60 px-4 py-4 text-sm text-ink-700 transition hover:bg-white"
            >
              Pantau ledger live stock
            </NuxtLink>
            <NuxtLink
              v-if="auth.role === 'OPERATOR'"
              to="/productions"
              class="rounded-2xl border border-white/40 bg-white/60 px-4 py-4 text-sm text-ink-700 transition hover:bg-white"
            >
              Input produksi harian
            </NuxtLink>
            <NuxtLink
              v-if="auth.role === 'OWNER' || auth.role === 'ADMIN'"
              to="/expenses"
              class="rounded-2xl border border-white/40 bg-white/60 px-4 py-4 text-sm text-ink-700 transition hover:bg-white"
            >
              Cek pengeluaran kandang
            </NuxtLink>
            <NuxtLink
              to="/calendar"
              class="rounded-2xl border border-white/40 bg-white/60 px-4 py-4 text-sm text-ink-700 transition hover:bg-white"
            >
              Lihat agenda kalender penuh
            </NuxtLink>
          </div>
        </TableCard>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <TableCard title="Order Terdekat" description="Pesanan yang perlu diperhatikan lebih dulu." icon="orders">
          <table class="min-w-full text-left text-sm">
            <thead class="text-ink-500">
              <tr>
                <th class="pb-3 pr-4">Customer</th>
                <th class="pb-3 pr-4">Tanggal</th>
                <th class="pb-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in todayOrders" :key="order.id" class="border-t border-white/40">
                <td class="py-4 pr-4">{{ order.customer.name }}</td>
                <td class="py-4 pr-4">{{ formatDate(order.deliveryDate) }}</td>
                <td class="py-4 pr-4">
                  <StatusChip kind="delivery" :value="order.deliveryStatus" />
                </td>
              </tr>
            </tbody>
          </table>
        </TableCard>

        <TableCard
          :title="auth.role === 'OPERATOR' ? 'Produksi Terbaru' : 'Pengeluaran Terbaru'"
          description="Feed ringkas dari aktivitas terbaru di backend."
          :icon="auth.role === 'OPERATOR' ? 'productions' : 'expenses'"
        >
          <div class="space-y-3 text-sm">
            <template v-if="auth.role === 'OPERATOR'">
              <div
                v-for="item in productions"
                :key="item.id"
                class="rounded-2xl border border-white/40 bg-white/60 px-4 py-3"
              >
                {{ item.coopName }} • {{ formatDate(item.date) }} • {{ formatKg(item.goodKg) }} kg
              </div>
              <p v-if="!productions.length" class="text-ink-500">Belum ada data produksi terbaru.</p>
            </template>
            <template v-else>
              <div
                v-for="item in expenses"
                :key="item.id"
                class="rounded-2xl border border-white/40 bg-white/60 px-4 py-3"
              >
                {{ item.coopName }} • {{ formatRupiah(item.amount) }}
              </div>
              <p v-if="!expenses.length" class="text-ink-500">Belum ada pengeluaran terbaru.</p>
            </template>
          </div>
        </TableCard>
      </div>
    </template>

    <UiDialog
      v-model:open="createOrderOpen"
      title="Buat Pesanan Baru"
      description="Quick action admin untuk membuat order langsung dari dashboard."
      size="xl"
    >
      <FormsOrderForm
        :customer-options="customerOptions"
        :combined-available-kg="liveStock?.combinedAvailableKg ?? null"
        :submitting="creatingOrder"
        @submit="createOrder"
      />
    </UiDialog>
  </div>
</template>
