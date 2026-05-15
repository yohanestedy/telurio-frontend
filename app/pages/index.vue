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
import { useCoopOptions } from '../composables/useCoopOptions'
import { useOwnerOptions } from '../composables/useOwnerOptions'

definePageMeta({
  title: 'Dashboard',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
})

const api = useApi()
const auth = useAuthStore()
const toast = useToast()
const { can } = useAuth()
const { currentPrice, todayPriceMissing, loadTodayPriceStatus } = useTodayPriceStatus()
const { t } = useI18n()

const loading = ref(true)
const error = ref('')
const todayCalendar = ref<CalendarDay | null>(null)
const tomorrowCalendar = ref<CalendarDay | null>(null)
const { coops: dashboardCoops, loadCoops: loadDashboardCoops } = useCoopOptions()
const grossIncome = ref<GrossIncomeItem[]>([])
const liveStock = ref<LiveStockResponse | null>(null)
const todayStockMovements = ref<StockMovementItem[]>([])
const monthlySummary = ref<MonthlySummaryResponse | null>(null)
const productionAnalytics = ref<ProductionAnalyticsResponse | null>(null)
const productionAnalyticsLoading = ref(false)
const productionAnalyticsPeriod = ref<ProductionAnalyticsPeriod>('1w')
const productionAnalyticsCoopId = ref('')
const productionAnalyticsEndDate = ref(isoDate(new Date()))
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
const { owners: dashboardOwners, loadOwners: loadDashboardOwners } = useOwnerOptions()
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
      loadDashboardCoops({
        all: true,
        isActive: true,
        sortBy: 'name',
        order: 'asc',
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

    if (auth.role === 'ADMIN') {
      tasks.push(loadDashboardOwners().catch(() => undefined))
    }

    await Promise.all(tasks)
    shareImageVersion.value = Date.now()
  } catch (caught) {
    error.value = useApi().mapError(caught).message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  productionAnalyticsEndDate.value = isoDate(new Date())
  void loadDashboard()
})

watch([productionAnalyticsPeriod, productionAnalyticsCoopId, productionAnalyticsEndDate], () => {
  if (!loading.value) {
    void loadProductionAnalytics()
  }
})

async function loadProductionAnalytics() {
  productionAnalyticsLoading.value = true

  try {
    productionAnalytics.value = await api.get<ProductionAnalyticsResponse>('/productions/analytics', {
      period: productionAnalyticsPeriod.value,
      endDate: productionAnalyticsEndDate.value,
      ...(productionAnalyticsCoopId.value ? { coopId: productionAnalyticsCoopId.value } : {}),
    })
  } finally {
    productionAnalyticsLoading.value = false
  }
}

function productionAnalyticsPeriodDays(period: ProductionAnalyticsPeriod) {
  return {
    '1w': 7,
    '1m': 30,
    '3m': 90,
    '6m': 180,
  }[period]
}

function updateProductionAnalyticsPeriod(value: ProductionAnalyticsPeriod) {
  productionAnalyticsPeriod.value = value
  productionAnalyticsEndDate.value = isoDate(new Date())
}

function shiftProductionAnalyticsPeriod(direction: 'previous' | 'next') {
  const days = productionAnalyticsPeriodDays(productionAnalyticsPeriod.value)
  const cursor = new Date(`${productionAnalyticsEndDate.value}T00:00:00`)
  cursor.setDate(cursor.getDate() + (direction === 'previous' ? -days : days))

  const today = isoDate(new Date())
  const nextDate = isoDate(cursor)
  productionAnalyticsEndDate.value = direction === 'next' && nextDate > today ? today : nextDate
}

const dashboardCards = computed(() => [
  {
    label: t('dashboard.metric.combinedStock'),
    key: 'stock',
    value: `${formatKg(liveStock.value?.combinedAvailableKg ?? 0)} kg`,
    helper: t('dashboard.metric.stockHelper', {
      inKg: formatKg(liveStock.value?.combinedTodayInKg ?? 0),
      outKg: formatKg(liveStock.value?.combinedTodayOutKg ?? 0),
    }),
  },
  {
    label: t('dashboard.metric.activePrice'),
    key: 'price',
    value: currentPrice.value ? formatRupiah(currentPrice.value.pricePerKg) : '-',
    helper: currentPrice.value ? formatDate(currentPrice.value.effectiveDate) : t('dashboard.metric.missingPrice'),
  },
  {
    label: t('dashboard.metric.todayOrders'),
    key: 'orders',
    value: String(todayCalendar.value?.events.orders.length ?? 0),
    helper: t('dashboard.metric.todayOrderHelper'),
  },
  {
    label: auth.role === 'OWNER' ? t('dashboard.metric.ownerShare') : t('dashboard.metric.grossIncome'),
    key: 'income',
    value:
      auth.role === 'OWNER' && monthlySummary.value
        ? formatRupiah(monthlySummary.value.totalOwnerShare)
        : formatRupiah(grossIncome.value.reduce((sum, item) => sum + Number(item.grossIncome), 0)),
    helper: t('dashboard.metric.grossHelper'),
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
  allocationModalMode.value === 'edit' ? t('dialog.allocation.editTitle') : t('dialog.allocation.startTitle'),
)

const allocationDialogDescription = computed(() =>
  allocationModalMode.value === 'edit'
    ? t('dialog.allocation.editDescription')
    : t('dialog.allocation.startDescription'),
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
    toast.error(t('toast.delivery.prepareFailed'), api.mapError(caught).message)
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
    toast.error(t('toast.payment.prepareFailed'), api.mapError(caught).message)
  } finally {
    paymentModalLoading.value = false
  }
}

function dashboardOrderActions(order: CalendarOrder): CalendarOrderAction[] {
  const actions: CalendarOrderAction[] = []

  if (auth.role === 'OPERATOR' && order.deliveryStatus === 'BELUM_DIHANTAR') {
    actions.push({
      id: 'start-delivery',
      label: t('order.action.startDelivery'),
      icon: 'package',
      variant: 'primary',
      prominent: true,
    })
  }

  if (auth.role === 'OPERATOR' && order.deliveryStatus === 'SEDANG_DIHANTAR') {
    actions.push({
      id: 'complete-delivery',
      label: t('order.action.completeDelivery'),
      icon: 'chevronRight',
      variant: 'primary',
      prominent: true,
    })

    actions.push({
      id: 'edit-allocation',
      label: t('order.action.editAllocation'),
      icon: 'edit',
      variant: 'ghost',
    })
  }

  if (can('orders.pay') && order.paymentStatus !== 'LUNAS') {
    actions.push({
      id: 'payment-update',
      label: t('order.action.updatePayment'),
      icon: 'money',
      variant: 'ghost',
    })
  }

  actions.push({
    id: 'open-detail',
    label: t('order.action.viewDetail'),
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
      toast.success(t('toast.delivery.completed'))
      await loadDashboard()
    } catch (caught) {
      toast.error(t('toast.delivery.completeFailed'), api.mapError(caught).message)
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
        orderUpdatedAt: activeOrder.value.updatedAt,
      })
      toast.success(t('toast.allocation.updated'))
    } else {
      await api.post(`/orders/${activeOrder.value.id}/start-delivery`, payload)
      toast.success(t('toast.delivery.started'))
    }

    startDeliveryOpen.value = false
    await loadDashboard()
  } catch (caught) {
    toast.error(
      allocationModalMode.value === 'edit'
        ? t('toast.allocation.updateFailed')
        : t('toast.delivery.startFailed'),
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
    toast.success(t('toast.payment.updated'))
    paymentOpen.value = false
    await loadDashboard()
  } catch (caught) {
    toast.error(t('toast.payment.updateFailed'), api.mapError(caught).message)
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
    toast.success(t('toast.population.updated'))
    populationOpen.value = false
    activePopulationCoop.value = null
    await loadDashboard()
  } catch (caught) {
    toast.error(t('toast.population.updateFailed'), api.mapError(caught).message)
  } finally {
    modalSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <DashboardSkeleton v-if="loading" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="loadDashboard">{{ t('common.retry') }}</UiButton>
    </ErrorState>
    <template v-else>
      <TodayPriceNotice
        v-if="todayPriceMissing"
        :title="t('notice.todayPriceMissing.title')"
        :message="auth.role === 'ADMIN'
          ? t('notice.todayPriceMissing.admin')
          : t('notice.todayPriceMissing.user')"
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
          :icon="card.key === 'stock'
            ? 'layers'
            : card.key === 'price'
              ? 'prices'
              : card.key === 'orders'
                ? 'orders'
                : 'reports'"
        >
          <template v-if="card.key === 'price'" #action>
            <PublicPriceShareMenu
              icon-only
              :effective-date="currentPrice?.effectiveDate ?? null"
              :image-version="shareImageVersion"
            />
          </template>
        </MetricCard>
      </div>

      <div class="grid gap-6 min-[1024px]:grid-cols-10 min-[1024px]:items-stretch min-[1866px]:grid-cols-12">
        <TableCard
          :title="t('dashboard.card.liveStock.title')"
          :description="t('dashboard.card.liveStock.description')"
          icon="layers"
          class="min-[1024px]:order-1 min-[1024px]:col-span-6 min-[1024px]:h-full min-[1866px]:col-span-4"
        >
          <div v-if="liveStock?.coops?.length" class="space-y-2.5 min-[1024px]:max-h-[37rem] min-[1024px]:overflow-y-auto min-[1024px]:pr-1">
            <DashboardLiveStockCoopCard
              v-for="item in liveStock.coops"
              :key="item.coopId"
              :item="item"
              :summary="coopFlowSummary(item.coopId)"
              @show-detail="openCoopFlowDetail(item)"
            />
          </div>
          <p v-else class="text-sm text-ink-500">{{ t('dashboard.card.liveStock.empty') }}</p>
        </TableCard>

        <TableCard
          :title="t('dashboard.card.scheduledOrders.title')"
          :description="t('dashboard.card.scheduledOrders.description')"
          icon="orders"
          class="min-[1024px]:order-2 min-[1024px]:col-span-4 min-[1024px]:h-full min-[1866px]:col-span-3"
        >
          <div class="space-y-4 min-[1024px]:max-h-[37rem] min-[1024px]:overflow-y-auto min-[1024px]:pr-1">
            <section class="overflow-hidden rounded-2xl border border-white/70 bg-white/55">
              <div class="flex items-center justify-between gap-2 border-b border-white/70 px-3 py-2.5">
                <p class="text-base font-bold text-ink-900 sm:text-lg">{{ t('common.today') }}</p>
                <span class="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-ink-600 sm:text-xs">
                  {{ formatWeekdayDayMonthYearId(todayDate) }}
                </span>
              </div>
              <CalendarOrderList
                dense
                :orders="todayCalendar?.events.orders ?? []"
                :order-actions="dashboardOrderActions"
                :action-submitting-order-id="actionSubmittingOrderId"
                :empty-message="t('dashboard.card.scheduledOrders.emptyToday')"
                @action="handleDashboardOrderAction"
              />
            </section>

            <section class="overflow-hidden rounded-2xl border border-white/70 bg-white/55">
              <div class="flex items-center justify-between gap-2 border-b border-white/70 px-3 py-2.5">
                <p class="text-base font-bold text-ink-900 sm:text-lg">{{ t('common.tomorrow') }}</p>
                <span class="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-ink-600 sm:text-xs">
                  {{ formatWeekdayDayMonthYearId(tomorrowDate) }}
                </span>
              </div>
              <CalendarOrderList
                dense
                :orders="tomorrowCalendar?.events.orders ?? []"
                :order-actions="dashboardOrderActions"
                :action-submitting-order-id="actionSubmittingOrderId"
                :empty-message="t('dashboard.card.scheduledOrders.emptyTomorrow')"
                @action="handleDashboardOrderAction"
              />
            </section>
          </div>
        </TableCard>

        <TableCard
          :title="t('dashboard.card.production.title')"
          :description="t('dashboard.card.production.description')"
          icon="productions"
          class="min-[1024px]:order-3 min-[1024px]:col-span-10 min-[1581px]:col-span-6 min-[1024px]:h-full min-[1866px]:col-span-5"
        >
          <DashboardProductionAnalyticsCard
            :period="productionAnalyticsPeriod"
            v-model:coop-id="productionAnalyticsCoopId"
            :analytics="productionAnalytics"
            :loading="productionAnalyticsLoading"
            :coops="dashboardCoops"
            @update:period="updateProductionAnalyticsPeriod"
            @navigate-period="shiftProductionAnalyticsPeriod"
          />
        </TableCard>

        <!-- Expense Overview (ADMIN + OWNER only) -->
        <DashboardExpenseCard
          v-if="can('expenses.view')"
          :coops="activeCoops"
          :owners="dashboardOwners"
          class="min-[1024px]:order-4 min-[1024px]:col-span-10 min-[1866px]:col-span-12"
        />

        <TableCard
          :title="t('dashboard.card.coopProfile.title')"
          :description="t('dashboard.card.coopProfile.description')"
          icon="coops"
          class="min-[1024px]:order-5 min-[1024px]:col-span-10 min-[1581px]:col-span-4 min-[1866px]:col-span-12"
        >
          <div v-if="dashboardCoops.length" class="grid gap-3 md:grid-cols-2 min-[1581px]:grid-cols-1 min-[1866px]:grid-cols-2">
            <DashboardCoopProfileCard
              v-for="coop in dashboardCoops"
              :key="coop.id"
              :coop="coop"
              :can-update-population="can('coops.manage')"
              @update-population="openPopulationModal"
            />
          </div>
          <p v-else class="text-sm text-ink-500">{{ t('dashboard.card.coopProfile.empty') }}</p>
        </TableCard>
      </div>

      <DashboardCoopFlowDetailDialog
        v-model:open="coopFlowDetailOpen"
        :loading="coopFlowDetailLoading"
        :coop-name="activeCoopForDetail?.coopName ?? '-'"
        :date-label="formatDate(isoDate(new Date()))"
        :current-stock-kg="activeCoopForDetail?.availableKg ?? 0"
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
        :submit-label="allocationModalMode === 'edit' ? t('order.action.saveAllocation') : t('order.action.startDelivery')"
        :submitting="modalSubmitting"
        @submit="submitDeliveryAllocation"
      />
    </UiDialog>

    <UiDialog
      v-model:open="paymentOpen"
      :title="t('dialog.payment.title')"
      :description="t('dialog.payment.description')"
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
      :title="t('dialog.population.title')"
      :description="t('dialog.population.description')"
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
