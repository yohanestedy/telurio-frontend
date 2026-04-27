<script setup lang="ts">
import type {
  CalendarDay,
  CustomerItem,
  ExpenseItem,
  GrossIncomeItem,
  LiveStockCoopItem,
  LiveStockResponse,
  MonthlySummaryResponse,
  OrderItem,
  ProductionItem,
  StockMovementItem,
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
const todayStockMovements = ref<StockMovementItem[]>([])
const monthlySummary = ref<MonthlySummaryResponse | null>(null)
const customers = ref<CustomerItem[]>([])
const createOrderOpen = ref(false)
const creatingOrder = ref(false)
const shareImageVersion = ref(Date.now())
const coopFlowDetailOpen = ref(false)
const coopFlowDetailLoading = ref(false)
const activeCoopForDetail = ref<LiveStockCoopItem | null>(null)
const activeCoopFlowDetail = ref<CoopFlowDetailPayload | null>(null)

const orderDetailCache = ref<Record<string, OrderItem>>({})

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
      api.getPage<StockMovementItem[]>('/stocks/movements', {
        all: true,
        sortBy: 'createdAt',
        order: 'desc',
        startDate: today,
        endDate: today,
      }).then((value) => {
        todayStockMovements.value = value.data
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

interface CoopDailyFlow {
  productionInKg: number
  allocationReleaseInKg: number
  adjustmentInKg: number
  allocationOutKg: number
  adjustmentOutKg: number
  totalInKg: number
  totalOutKg: number
}

interface CoopFlowSummary extends CoopDailyFlow {
  netFlowKg: number
}

interface ProductionFlowDetail {
  movementId: string
  quantityKg: string
  goodCount: number | null
  collectionTime: string | null
  operatorName: string | null
  createdAt: string
  notes: string | null
}

interface AllocationFlowDetail {
  movementId: string
  orderId: string | null
  customerName: string | null
  deliveryDate: string | null
  allocatedKg: string
  orderQuantityKg: string | null
  pricePerKg: string | null
  totalInvoice: string | null
  operatorName: string | null
  createdAt: string
}

interface AdjustmentFlowDetail {
  movementId: string
  movementType: StockMovementItem['movementType']
  movementTypeLabel: string
  quantityKg: string
  notes: string | null
  operatorName: string | null
  createdAt: string
}

interface CoopFlowDetailPayload {
  inDetails: {
    productions: ProductionFlowDetail[]
    allocationReleases: AllocationFlowDetail[]
    adjustments: AdjustmentFlowDetail[]
  }
  outDetails: {
    allocations: AllocationFlowDetail[]
    adjustments: AdjustmentFlowDetail[]
  }
}

function normalizeKgNumber(value: number) {
  return Number(value.toFixed(3))
}

function emptyCoopDailyFlow(): CoopDailyFlow {
  return {
    productionInKg: 0,
    allocationReleaseInKg: 0,
    adjustmentInKg: 0,
    allocationOutKg: 0,
    adjustmentOutKg: 0,
    totalInKg: 0,
    totalOutKg: 0,
  }
}

const dailyFlowByCoop = computed(() => {
  const map = new Map<string, CoopDailyFlow>()

  for (const item of liveStock.value?.coops ?? []) {
    map.set(item.coopId, emptyCoopDailyFlow())
  }

  for (const movement of todayStockMovements.value) {
    const quantity = normalizeKgNumber(Number(movement.quantityKg))
    if (Number.isNaN(quantity) || quantity <= 0) {
      continue
    }

    const flow = map.get(movement.coopId) ?? emptyCoopDailyFlow()

    if (movement.direction === 'IN') {
      flow.totalInKg = normalizeKgNumber(flow.totalInKg + quantity)

      if (movement.movementType === 'PRODUCTION_IN') {
        flow.productionInKg = normalizeKgNumber(flow.productionInKg + quantity)
      } else if (movement.movementType === 'ALLOCATION_RELEASE') {
        flow.allocationReleaseInKg = normalizeKgNumber(flow.allocationReleaseInKg + quantity)
      } else {
        flow.adjustmentInKg = normalizeKgNumber(flow.adjustmentInKg + quantity)
      }
    } else {
      flow.totalOutKg = normalizeKgNumber(flow.totalOutKg + quantity)

      if (movement.movementType === 'ALLOCATION_OUT') {
        flow.allocationOutKg = normalizeKgNumber(flow.allocationOutKg + quantity)
      } else {
        flow.adjustmentOutKg = normalizeKgNumber(flow.adjustmentOutKg + quantity)
      }
    }

    map.set(movement.coopId, flow)
  }

  return map
})

function coopFlow(coopId: string) {
  return dailyFlowByCoop.value.get(coopId) ?? emptyCoopDailyFlow()
}

function movementTypeLabel(value: StockMovementItem['movementType']) {
  return {
    PRODUCTION_IN: 'Produksi Masuk',
    PRODUCTION_CORRECTION_IN: 'Koreksi Produksi (+)',
    PRODUCTION_CORRECTION_OUT: 'Koreksi Produksi (-)',
    ALLOCATION_OUT: 'Alokasi Order',
    ALLOCATION_RELEASE: 'Rilis Alokasi',
    MANUAL_ADJUST_IN: 'Penyesuaian Manual (+)',
    MANUAL_ADJUST_OUT: 'Penyesuaian Manual (-)',
  }[value]
}

function coopFlowSummary(coopId: string): CoopFlowSummary {
  const flow = coopFlow(coopId)

  return {
    ...flow,
    netFlowKg: normalizeKgNumber(flow.totalInKg - flow.totalOutKg),
  }
}

function emptyCoopFlowDetail(): CoopFlowDetailPayload {
  return {
    inDetails: {
      productions: [],
      allocationReleases: [],
      adjustments: [],
    },
    outDetails: {
      allocations: [],
      adjustments: [],
    },
  }
}

async function loadOrderDetailsMap(orderIds: string[]) {
  const uniqueIds = [...new Set(orderIds.filter((item): item is string => Boolean(item)))]
  const missingIds = uniqueIds.filter((id) => !orderDetailCache.value[id])

  if (missingIds.length) {
    const results = await Promise.all(
      missingIds.map(async (id) => {
        try {
          const detail = await api.get<OrderItem>(`/orders/${id}`)
          return { id, detail }
        } catch {
          return null
        }
      }),
    )

    for (const result of results) {
      if (result) {
        orderDetailCache.value[result.id] = result.detail
      }
    }
  }

  return new Map(
    uniqueIds.map((id) => [id, orderDetailCache.value[id] ?? null]),
  )
}

function buildAllocationDetailRow(
  movement: StockMovementItem,
  order: OrderItem | null | undefined,
): AllocationFlowDetail {
  return {
    movementId: movement.id,
    orderId: movement.orderId,
    customerName: order?.customer.name ?? null,
    deliveryDate: order?.deliveryDate ?? null,
    allocatedKg: movement.quantityKg,
    orderQuantityKg: order?.quantityKg ?? null,
    pricePerKg: order?.pricePerKg ?? null,
    totalInvoice: order?.totalInvoice ?? null,
    operatorName: movement.createdByName ?? null,
    createdAt: movement.createdAt,
  }
}

function buildAdjustmentDetailRow(movement: StockMovementItem): AdjustmentFlowDetail {
  return {
    movementId: movement.id,
    movementType: movement.movementType,
    movementTypeLabel: movementTypeLabel(movement.movementType),
    quantityKg: movement.quantityKg,
    notes: movement.notes,
    operatorName: movement.createdByName ?? null,
    createdAt: movement.createdAt,
  }
}

async function openCoopFlowDetail(coop: LiveStockCoopItem) {
  coopFlowDetailOpen.value = true
  coopFlowDetailLoading.value = true
  activeCoopForDetail.value = coop
  activeCoopFlowDetail.value = emptyCoopFlowDetail()

  try {
    const today = isoDate(new Date())
    const coopMovements = todayStockMovements.value.filter(
      (movement) => movement.coopId === coop.coopId,
    )

    const productionInMovements = coopMovements.filter(
      (movement) => movement.direction === 'IN' && movement.movementType === 'PRODUCTION_IN',
    )
    const allocationReleaseMovements = coopMovements.filter(
      (movement) => movement.direction === 'IN' && movement.movementType === 'ALLOCATION_RELEASE',
    )
    const adjustmentInMovements = coopMovements.filter(
      (movement) =>
        movement.direction === 'IN'
        && movement.movementType !== 'PRODUCTION_IN'
        && movement.movementType !== 'ALLOCATION_RELEASE',
    )
    const allocationOutMovements = coopMovements.filter(
      (movement) => movement.direction === 'OUT' && movement.movementType === 'ALLOCATION_OUT',
    )
    const adjustmentOutMovements = coopMovements.filter(
      (movement) => movement.direction === 'OUT' && movement.movementType !== 'ALLOCATION_OUT',
    )

    const orderIds = [
      ...allocationReleaseMovements.map((movement) => movement.orderId).filter(Boolean),
      ...allocationOutMovements.map((movement) => movement.orderId).filter(Boolean),
    ] as string[]

    const [productionResponse, orderMap] = await Promise.all([
      productionInMovements.length
        ? api.getPage<ProductionItem[]>('/productions', {
            all: true,
            coopId: coop.coopId,
            date: today,
            sortBy: 'createdAt',
            order: 'asc',
          }).then((response) => response.data)
        : Promise.resolve([] as ProductionItem[]),
      loadOrderDetailsMap(orderIds),
    ])

    const productionMap = new Map(
      productionResponse.map((item) => [item.id, item]),
    )

    const inProductionDetails: ProductionFlowDetail[] = productionInMovements.map((movement) => {
      const production = productionMap.get(movement.sourceId)

      return {
        movementId: movement.id,
        quantityKg: movement.quantityKg,
        goodCount: production?.goodCount ?? null,
        collectionTime: production?.collectionTime ?? null,
        operatorName: production?.createdByName ?? movement.createdByName ?? null,
        createdAt: production?.createdAt ?? movement.createdAt,
        notes: production?.notes ?? movement.notes,
      }
    })

    const inAllocationReleaseDetails = allocationReleaseMovements.map((movement) =>
      buildAllocationDetailRow(
        movement,
        movement.orderId ? orderMap.get(movement.orderId) : null,
      ))

    const outAllocationDetails = allocationOutMovements.map((movement) =>
      buildAllocationDetailRow(
        movement,
        movement.orderId ? orderMap.get(movement.orderId) : null,
      ))

    activeCoopFlowDetail.value = {
      inDetails: {
        productions: inProductionDetails,
        allocationReleases: inAllocationReleaseDetails,
        adjustments: adjustmentInMovements.map(buildAdjustmentDetailRow),
      },
      outDetails: {
        allocations: outAllocationDetails,
        adjustments: adjustmentOutMovements.map(buildAdjustmentDetailRow),
      },
    }
  } catch (caught) {
    toast.error('Gagal memuat detail alur kandang', api.mapError(caught).message)
  } finally {
    coopFlowDetailLoading.value = false
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
        description="Stok aktif + breakdown alur pergerakan hari ini per kandang."
        icon="layers"
      >
        <div v-if="liveStock?.coops?.length" class="space-y-2.5">
          <DashboardLiveStockCoopCard
            v-for="item in liveStock.coops"
            :key="item.coopId"
            :item="item"
            :summary="coopFlowSummary(item.coopId)"
            @show-detail="openCoopFlowDetail(item)"
          />
        </div>
        <p v-else class="text-sm text-ink-500">Belum ada stok kandang dalam scope akses Anda.</p>
      </TableCard>

      <DashboardCoopFlowDetailDialog
        v-model:open="coopFlowDetailOpen"
        :loading="coopFlowDetailLoading"
        :coop-name="activeCoopForDetail?.coopName ?? '-'"
        :date-label="formatDate(isoDate(new Date()))"
        :summary="activeCoopForDetail ? coopFlowSummary(activeCoopForDetail.coopId) : null"
        :in-details="activeCoopFlowDetail?.inDetails"
        :out-details="activeCoopFlowDetail?.outDetails"
      />

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
        :today-price-per-kg="currentPrice?.pricePerKg ?? null"
        :combined-available-kg="liveStock?.combinedAvailableKg ?? null"
        :submitting="creatingOrder"
        @submit="createOrder"
      />
    </UiDialog>
  </div>
</template>
