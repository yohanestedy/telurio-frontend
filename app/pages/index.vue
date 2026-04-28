<script setup lang="ts">
import type {
  AllocationItem,
  CalendarDay,
  CoopItem,
  GrossIncomeItem,
  LiveStockCoopItem,
  LiveStockResponse,
  MonthlySummaryResponse,
  OrderItem,
  ProductionAnalyticsPeriod,
  ProductionAnalyticsResponse,
  ProductionItem,
  StockMovementItem,
} from '../types/domain'
import type { CalendarOrder, CalendarOrderAction } from '../types/calendar-orders'

definePageMeta({
  title: 'Dashboard',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
})

const api = useApi()
const auth = useAuthStore()
const toast = useToast()
const { can } = useAuth()
const { currentPrice, todayPriceMissing, loadTodayPriceStatus } = useTodayPriceStatus()

const loading = ref(true)
const error = ref('')
const todayCalendar = ref<CalendarDay | null>(null)
const tomorrowCalendar = ref<CalendarDay | null>(null)
const dashboardCoops = ref<CoopItem[]>([])
const grossIncome = ref<GrossIncomeItem[]>([])
const liveStock = ref<LiveStockResponse | null>(null)
const todayStockMovements = ref<StockMovementItem[]>([])
const monthlySummary = ref<MonthlySummaryResponse | null>(null)
const productionAnalytics = ref<ProductionAnalyticsResponse | null>(null)
const productionAnalyticsLoading = ref(false)
const productionAnalyticsPeriod = ref<ProductionAnalyticsPeriod>('1w')
const productionAnalyticsCoopId = ref('')
const shareImageVersion = ref(Date.now())
const coopFlowDetailOpen = ref(false)
const coopFlowDetailLoading = ref(false)
const activeCoopForDetail = ref<LiveStockCoopItem | null>(null)
const activeCoopFlowDetail = ref<CoopFlowDetailPayload | null>(null)
const actionSubmittingOrderId = ref('')
const modalSubmitting = ref(false)
const startDeliveryOpen = ref(false)
const paymentOpen = ref(false)
const populationOpen = ref(false)
const allocationModalLoading = ref(false)
const paymentModalLoading = ref(false)
const activeOrder = ref<OrderItem | null>(null)
const activePopulationCoop = ref<CoopItem | null>(null)
const activeCoops = ref<CoopItem[]>([])
const activeLiveStock = ref<LiveStockResponse | null>(null)
const activeAllocations = ref<AllocationItem[]>([])
const allocationModalMode = ref<'start' | 'edit'>('start')

const orderDetailCache = ref<Record<string, OrderItem>>({})

async function loadDashboard() {
  loading.value = true
  error.value = ''

  try {
    const today = isoDate(new Date())
    const tomorrow = isoDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
    const tasks: Array<Promise<unknown>> = [
      loadTodayPriceStatus(),
      api.get<CalendarDay>(`/calendar/${today}`).then((value) => {
        todayCalendar.value = value
      }),
      api.get<CalendarDay>(`/calendar/${tomorrow}`).then((value) => {
        tomorrowCalendar.value = value
      }),
      api.getPage<CoopItem[]>('/coops', {
        all: true,
        isActive: true,
        sortBy: 'name',
        order: 'asc',
      }).then((value) => {
        dashboardCoops.value = value.data
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
      loadProductionAnalytics(),
    ]

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

watch([productionAnalyticsPeriod, productionAnalyticsCoopId], () => {
  if (!loading.value) {
    void loadProductionAnalytics()
  }
})

async function loadProductionAnalytics() {
  productionAnalyticsLoading.value = true

  try {
    productionAnalytics.value = await api.get<ProductionAnalyticsResponse>('/productions/analytics', {
      period: productionAnalyticsPeriod.value,
      ...(productionAnalyticsCoopId.value ? { coopId: productionAnalyticsCoopId.value } : {}),
    })
  } finally {
    productionAnalyticsLoading.value = false
  }
}

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
    value: String(todayCalendar.value?.events.orders.length ?? 0),
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

const todayDate = computed(() => isoDate(new Date()))
const tomorrowDate = computed(() => isoDate(new Date(Date.now() + 24 * 60 * 60 * 1000)))

const activeCoopOptions = computed(() =>
  activeCoops.value.map((item) => ({ label: item.name, value: item.id })),
)

const activeOrderIsTodayDelivery = computed(() =>
  activeOrder.value?.deliveryDate === todayDate.value,
)

const allocationDialogTitle = computed(() =>
  allocationModalMode.value === 'edit' ? 'Ubah Alokasi Pengantaran' : 'Start Delivery',
)

const allocationDialogDescription = computed(() =>
  allocationModalMode.value === 'edit'
    ? 'Koreksi alokasi kandang. Sistem akan menyesuaikan live stock secara otomatis.'
    : 'Masukkan alokasi kandang hingga totalnya sama dengan quantity order.',
)

async function loadOrderForAction(orderId: string) {
  return await api.get<OrderItem>(`/orders/${orderId}`)
}

async function openAllocationModal(orderId: string, mode: 'start' | 'edit') {
  allocationModalLoading.value = true

  try {
    const [orderDetail, coopList, stock, allocationList] = await Promise.all([
      loadOrderForAction(orderId),
      api.getPage<CoopItem[]>('/coops', { all: true }),
      api.get<LiveStockResponse>('/stocks/live'),
      mode === 'edit'
        ? api.get<AllocationItem[]>(`/orders/${orderId}/allocations`)
        : Promise.resolve([] as AllocationItem[]),
      loadTodayPriceStatus(),
    ])

    allocationModalMode.value = mode
    activeOrder.value = orderDetail
    activeCoops.value = coopList.data
    activeLiveStock.value = stock
    activeAllocations.value = allocationList
    startDeliveryOpen.value = true
  } catch (caught) {
    toast.error('Gagal menyiapkan modal pengantaran', api.mapError(caught).message)
  } finally {
    allocationModalLoading.value = false
  }
}

async function openPaymentModal(orderId: string) {
  paymentModalLoading.value = true

  try {
    activeOrder.value = await loadOrderForAction(orderId)
    paymentOpen.value = true
  } catch (caught) {
    toast.error('Gagal menyiapkan modal pembayaran', api.mapError(caught).message)
  } finally {
    paymentModalLoading.value = false
  }
}

function dashboardOrderActions(order: CalendarOrder): CalendarOrderAction[] {
  const actions: CalendarOrderAction[] = []

  if (auth.role === 'OPERATOR' && order.deliveryStatus === 'BELUM_DIHANTAR') {
    actions.push({
      id: 'start-delivery',
      label: 'Mulai Hantar',
      icon: 'package',
      variant: 'primary',
      prominent: true,
    })
  }

  if (auth.role === 'OPERATOR' && order.deliveryStatus === 'SEDANG_DIHANTAR') {
    actions.push({
      id: 'complete-delivery',
      label: 'Selesai Hantar',
      icon: 'chevronRight',
      variant: 'primary',
      prominent: true,
    })

    actions.push({
      id: 'edit-allocation',
      label: 'Ubah Alokasi',
      icon: 'edit',
      variant: 'ghost',
    })
  }

  if (can('orders.pay') && order.paymentStatus !== 'LUNAS') {
    actions.push({
      id: 'payment-update',
      label: 'Update Bayar',
      icon: 'money',
      variant: 'ghost',
    })
  }

  actions.push({
    id: 'open-detail',
    label: 'Lihat Detail',
    icon: 'search',
    variant: 'ghost',
    iconOnly: true,
  })

  return actions
}

async function handleDashboardOrderAction(order: CalendarOrder, action: CalendarOrderAction) {
  if (action.id === 'complete-delivery') {
    actionSubmittingOrderId.value = order.orderId
    try {
      await api.post(`/orders/${order.orderId}/complete-delivery`)
      toast.success('Pengantaran berhasil diselesaikan')
      await loadDashboard()
    } catch (caught) {
      toast.error('Gagal menyelesaikan pengantaran', api.mapError(caught).message)
    } finally {
      actionSubmittingOrderId.value = ''
    }
    return
  }

  if (action.id === 'start-delivery') {
    await openAllocationModal(order.orderId, 'start')
    return
  }

  if (action.id === 'edit-allocation') {
    await openAllocationModal(order.orderId, 'edit')
    return
  }

  if (action.id === 'payment-update') {
    await openPaymentModal(order.orderId)
    return
  }

  await navigateTo({
    path: `/orders/${order.orderId}`,
  })
}

async function submitDeliveryAllocation(payload: { allocations: Array<{ coopId: string; quantityKg: number }>; customPricePerKg?: number }) {
  if (!activeOrder.value) {
    return
  }

  modalSubmitting.value = true
  try {
    if (allocationModalMode.value === 'edit') {
      await api.patch(`/orders/${activeOrder.value.id}/allocations`, {
        allocations: payload.allocations,
      })
      toast.success('Alokasi pengantaran berhasil diperbarui')
    } else {
      await api.post(`/orders/${activeOrder.value.id}/start-delivery`, payload)
      toast.success('Pengantaran berhasil dimulai')
    }

    startDeliveryOpen.value = false
    await loadDashboard()
  } catch (caught) {
    toast.error(
      allocationModalMode.value === 'edit'
        ? 'Gagal mengubah alokasi'
        : 'Gagal memulai pengantaran',
      api.mapError(caught).message,
    )
  } finally {
    modalSubmitting.value = false
  }
}

async function submitPaymentUpdate(payload: Record<string, unknown>) {
  if (!activeOrder.value) {
    return
  }

  modalSubmitting.value = true
  try {
    await api.post(`/orders/${activeOrder.value.id}/payment-updates`, payload)
    toast.success('Pembayaran berhasil diperbarui')
    paymentOpen.value = false
    await loadDashboard()
  } catch (caught) {
    toast.error('Gagal update pembayaran', api.mapError(caught).message)
  } finally {
    modalSubmitting.value = false
  }
}

function openPopulationModal(coop: CoopItem) {
  activePopulationCoop.value = coop
  populationOpen.value = true
}

async function submitPopulationUpdate(payload: { population: number; populationChangeReason?: string }) {
  if (!activePopulationCoop.value) {
    return
  }

  modalSubmitting.value = true
  try {
    await api.patch(`/coops/${activePopulationCoop.value.id}`, payload)
    toast.success('Populasi kandang berhasil diperbarui')
    populationOpen.value = false
    activePopulationCoop.value = null
    await loadDashboard()
  } catch (caught) {
    toast.error('Gagal update populasi', api.mapError(caught).message)
  } finally {
    modalSubmitting.value = false
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

      <div class="grid gap-6 xl:grid-cols-12 xl:items-start">
        <TableCard
          title="Live Stock Per Kandang"
          description="Stok aktif + breakdown pergerakan telur hari ini per kandang."
          icon="layers"
          class="xl:col-span-7"
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

        <TableCard
          title="Pesanan Terjadwal"
          description="Pesanan hari ini dan besok yang perlu ditangani."
          icon="orders"
          class="xl:col-span-5"
        >
          <div class="space-y-4 xl:max-h-[calc(100vh-14rem)] xl:overflow-y-auto xl:pr-1">
            <section class="overflow-hidden rounded-2xl border border-white/70 bg-white/55">
              <div class="flex items-center justify-between gap-2 border-b border-white/70 px-3 py-2.5">
                <p class="text-sm font-semibold text-ink-900">Hari Ini</p>
                <span class="rounded-full border border-white/80 bg-white/80 px-2 py-1 text-[11px] text-ink-600">
                  {{ formatDate(todayDate) }}
                </span>
              </div>
              <CalendarOrderList
                dense
                :orders="todayCalendar?.events.orders ?? []"
                :order-actions="dashboardOrderActions"
                :action-submitting-order-id="actionSubmittingOrderId"
                empty-message="Tidak ada pesanan untuk hari ini."
                @action="handleDashboardOrderAction"
              />
            </section>

            <section class="overflow-hidden rounded-2xl border border-white/70 bg-white/55">
              <div class="flex items-center justify-between gap-2 border-b border-white/70 px-3 py-2.5">
                <p class="text-sm font-semibold text-ink-900">Besok</p>
                <span class="rounded-full border border-white/80 bg-white/80 px-2 py-1 text-[11px] text-ink-600">
                  {{ formatDate(tomorrowDate) }}
                </span>
              </div>
              <CalendarOrderList
                dense
                :orders="tomorrowCalendar?.events.orders ?? []"
                :order-actions="dashboardOrderActions"
                :action-submitting-order-id="actionSubmittingOrderId"
                empty-message="Tidak ada pesanan untuk besok."
                @action="handleDashboardOrderAction"
              />
            </section>
          </div>
        </TableCard>
      </div>

      <TableCard
        title="Profil Kandang"
        description="Strain ayam, populasi, dan umur ayam aktif per kandang."
        icon="coops"
      >
        <div v-if="dashboardCoops.length" class="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          <DashboardCoopProfileCard
            v-for="coop in dashboardCoops"
            :key="coop.id"
            :coop="coop"
            :can-update-population="can('coops.manage')"
            @update-population="openPopulationModal"
          />
        </div>
        <p v-else class="text-sm text-ink-500">Belum ada kandang aktif dalam scope akses Anda.</p>
      </TableCard>

      <TableCard
        title="Produksi Telur"
        description="Produksi butir dan performa berdasarkan periode."
        icon="productions"
      >
        <DashboardProductionAnalyticsCard
          v-model:period="productionAnalyticsPeriod"
          v-model:coop-id="productionAnalyticsCoopId"
          :analytics="productionAnalytics"
          :loading="productionAnalyticsLoading"
          :coops="dashboardCoops"
        />
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
    </template>

    <UiDialog
      v-model:open="startDeliveryOpen"
      :title="allocationDialogTitle"
      :description="allocationDialogDescription"
      size="xl"
    >
      <LoadingSkeleton v-if="allocationModalLoading" :lines="6" />
      <FormsDeliveryAllocationForm
        v-else-if="activeOrder"
        :coop-options="activeCoopOptions"
        :order-quantity-kg="activeOrder.quantityKg"
        :order-price-per-kg="activeOrder.pricePerKg"
        :today-price-per-kg="currentPrice?.pricePerKg ?? null"
        :can-set-price-now="allocationModalMode === 'start' && activeOrderIsTodayDelivery"
        :enable-price-lock="allocationModalMode === 'start'"
        :initial-allocations="allocationModalMode === 'edit' ? activeAllocations : []"
        :combined-available-kg="activeLiveStock?.combinedAvailableKg ?? null"
        :coop-stocks="activeLiveStock?.coops ?? []"
        :submit-label="allocationModalMode === 'edit' ? 'Simpan perubahan alokasi' : 'Mulai pengantaran'"
        :submitting="modalSubmitting"
        @submit="submitDeliveryAllocation"
      />
    </UiDialog>

    <UiDialog
      v-model:open="paymentOpen"
      title="Payment Update"
      description="Semua update pembayaran akan masuk ke payment history."
    >
      <LoadingSkeleton v-if="paymentModalLoading" :lines="5" />
      <FormsPaymentUpdateForm
        v-else-if="activeOrder"
        :submitting="modalSubmitting"
        :current-payment-status="activeOrder.paymentStatus"
        :total-invoice="activeOrder.totalInvoice"
        :dp-amount="activeOrder.dpAmount"
        @submit="submitPaymentUpdate"
      />
    </UiDialog>

    <UiDialog
      v-model:open="populationOpen"
      title="Update Populasi"
      description="Perubahan akan disimpan sebagai histori populasi kandang."
      size="md"
    >
      <FormsCoopPopulationForm
        v-if="activePopulationCoop"
        :coop="activePopulationCoop"
        :submitting="modalSubmitting"
        @submit="submitPopulationUpdate"
      />
    </UiDialog>
  </div>
</template>
