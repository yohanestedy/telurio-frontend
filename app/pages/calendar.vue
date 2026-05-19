<script setup lang="ts">
import dayjs from 'dayjs'
import type {
  AllocationItem,
  CalendarDay,
  CalendarMarkerDay,
  CoopItem,
  LiveStockResponse,
  OrderItem,
  PriceItem,
} from '../types/domain'
import {
  endOfWeekMonday,
  formatDayMonthYearId,
  startOfWeekMonday,
} from '../utils/calendar'
import { formatRupiah, isoDate } from '../utils/formatters'
import type { CalendarOrder, CalendarOrderAction } from '../types/calendar-orders'

definePageMeta({
  title: 'Calendar',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
  hideMobileTopbar: true,
})

const api = useApi()
const toast = useToast()
const auth = useAuthStore()
const ui = useUiStore()
const { can } = useAuth()
const { currentPrice, loadTodayPriceStatus } = useTodayPriceStatus()
const { t, locale } = useI18n()

const loading = ref(true)
const error = ref('')
const markerDays = ref<CalendarMarkerDay[]>([])
const selectedDate = ref(isoDate(new Date()))
const focusDate = ref(isoDate(new Date()))
const selectedDay = ref<CalendarDay>(emptyCalendarDay(selectedDate.value))
const actionSubmittingOrderId = ref('')
const modalSubmitting = ref(false)
const startDeliveryOpen = ref(false)
const paymentOpen = ref(false)
const allocationModalLoading = ref(false)
const paymentModalLoading = ref(false)
const activeOrder = ref<OrderItem | null>(null)
const activeCoops = ref<CoopItem[]>([])
const activeLiveStock = ref<LiveStockResponse | null>(null)
const activeAllocations = ref<AllocationItem[]>([])
const allocationModalMode = ref<'start' | 'edit'>('start')
const selectedPrice = ref<PriceItem | null>(null)
const selectedPriceLoading = ref(false)
const selectedPriceError = ref(false)
const dayDetailLoading = ref(false)
const expenseDetailOpen = ref(false)
const expenseDetailTitle = ref('')
const expenseDetailSubtitle = ref('')
const expenseDetailDate = ref('')
const expenseDetailItems = ref<Array<{ description: string; amount: string; categoryName?: string | null }>>([])
const expenseDetailTotal = ref('')

const selectedDateLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(selectedDate.value)),
)
const orderCountLabel = computed(() => `${selectedDay.value.events.orders.length}`)

function emptyCalendarDay(date: string): CalendarDay {
  return {
    date,
    events: {
      orders: [],
      productions: [],
      expenses: [],
      generalExpenses: [],
      priceUpdates: [],
    },
  }
}

const activeCoopOptions = computed(() =>
  activeCoops.value.map((item) => ({ label: item.name, value: item.id })),
)

// Group general expenses by owner for calendar display
const generalExpensesByOwner = computed(() => {
  const items = selectedDay.value.events.generalExpenses ?? []
  const map = new Map<string, { ownerName: string; total: bigint; items: typeof items }>()

  for (const item of items) {
    const key = item.ownerName ?? '—'
    const existing = map.get(key)
    if (existing) {
      existing.total += BigInt(item.amount)
      existing.items.push(item)
    } else {
      map.set(key, { ownerName: key, total: BigInt(item.amount), items: [item] })
    }
  }

  return [...map.values()].map((g) => ({
    ownerName: g.ownerName,
    total: g.total.toString(),
    items: g.items,
  }))
})

function openExpenseDetail(title: string, items: Array<{ description: string; amount: string; categoryName?: string | null }>, total: string) {
  expenseDetailTitle.value = title
  expenseDetailItems.value = items
  expenseDetailTotal.value = total
  expenseDetailOpen.value = true
}

function openCoopExpenseDetail(expense: { coopName: string; totalAmount: string; items: Array<{ description: string | null; amount: string; categoryName: string | null }> }) {
  expenseDetailTitle.value = t('calendar.marker.expense')
  expenseDetailSubtitle.value = expense.coopName
  expenseDetailDate.value = selectedDateLabel.value
  expenseDetailItems.value = expense.items.map((item) => ({
    description: item.description || expense.coopName,
    amount: item.amount,
    categoryName: item.categoryName,
  }))
  expenseDetailTotal.value = expense.totalAmount
  expenseDetailOpen.value = true
}

function openGeneralExpenseDetail(ownerName: string, items: Array<{ description: string; amount: string; categoryName?: string | null }>, total: string) {
  expenseDetailTitle.value = t('calendar.marker.generalExpense')
  expenseDetailSubtitle.value = ownerName
  expenseDetailDate.value = selectedDateLabel.value
  expenseDetailItems.value = items
  expenseDetailTotal.value = total
  expenseDetailOpen.value = true
}

const activeOrderIsTodayDelivery = computed(() => {
  if (!activeOrder.value) {
    return false
  }

  return isoDate(activeOrder.value.deliveryDate) === isoDate(new Date())
})

const allocationDialogTitle = computed(() =>
  allocationModalMode.value === 'edit' ? t('dialog.allocation.editTitle') : t('dialog.allocation.startTitle'),
)

const allocationDialogDescription = computed(() =>
  allocationModalMode.value === 'edit'
    ? t('dialog.allocation.editDescription')
    : t('dialog.allocation.startDescription'),
)

async function loadCalendar() {
  loading.value = true
  error.value = ''

  const focus = dayjs(focusDate.value)
  const range =
    ui.calendarView === 'day'
      ? { start: focus.startOf('day'), end: focus.endOf('day') }
      : ui.calendarView === 'week'
        ? { start: startOfWeekMonday(focusDate.value), end: endOfWeekMonday(focusDate.value) }
        : { start: focus.startOf('month'), end: focus.endOf('month') }

  if (ui.calendarView === 'month') {
    if (!dayjs(selectedDate.value).isSame(range.start, 'month')) {
      selectedDate.value = range.start.format('YYYY-MM-DD')
    }
  } else if (ui.calendarView === 'week') {
    const selected = dayjs(selectedDate.value)
    if (selected.isBefore(range.start, 'day') || selected.isAfter(range.end, 'day')) {
      selectedDate.value = focus.format('YYYY-MM-DD')
    }
  } else {
    selectedDate.value = focus.format('YYYY-MM-DD')
  }

  try {
    markerDays.value = await api.get<CalendarMarkerDay[]>('/calendar/markers', {
      startDate: range.start.format('YYYY-MM-DD'),
      endDate: range.end.format('YYYY-MM-DD'),
    })
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function loadSelectedDayDetail(date: string) {
  try {
    selectedDay.value = await api.get<CalendarDay>(`/calendar/${date}`)
  } catch (caught) {
    error.value = api.mapError(caught).message
    selectedDay.value = emptyCalendarDay(date)
  }
}

async function loadSelectedPriceForDate(date: string) {
  selectedPriceLoading.value = true
  selectedPriceError.value = false

  try {
    selectedPrice.value = await api.get<PriceItem>('/prices/current', { date })
  } catch (caught) {
    const mapped = api.mapError(caught)

    selectedPrice.value = null
    selectedPriceError.value = mapped.status !== 404
  } finally {
    selectedPriceLoading.value = false
  }
}

async function loadDayDetail(date: string) {
  dayDetailLoading.value = true
  await Promise.all([
    loadSelectedDayDetail(date),
    loadSelectedPriceForDate(date),
  ])
  dayDetailLoading.value = false
}

async function syncCalendarPanel() {
  await loadCalendar()
  await loadDayDetail(selectedDate.value)
}

async function selectDate(date: string) {
  selectedDate.value = date

  if (ui.calendarView === 'month') {
    const targetMonth = dayjs(date).startOf('month').format('YYYY-MM-DD')
    if (targetMonth !== dayjs(focusDate.value).startOf('month').format('YYYY-MM-DD')) {
      focusDate.value = targetMonth
      await loadCalendar()
    }
  } else {
    focusDate.value = dayjs(date).format('YYYY-MM-DD')
  }

  if (ui.calendarView === 'day') {
    await Promise.all([
      loadCalendar(),
      loadDayDetail(selectedDate.value),
    ])
    return
  }

  await loadDayDetail(selectedDate.value)
}

async function changeMonth(month: string) {
  focusDate.value =
    ui.calendarView === 'month'
      ? dayjs(month).startOf('month').format('YYYY-MM-DD')
      : dayjs(month).format('YYYY-MM-DD')

  if (ui.calendarView === 'day') {
    selectedDate.value = dayjs(month).format('YYYY-MM-DD')
  }

  await syncCalendarPanel()
}

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

async function refreshCalendarDetailAfterAction() {
  await loadCalendar()

  await Promise.all([
    loadSelectedDayDetail(selectedDate.value),
    loadSelectedPriceForDate(selectedDate.value),
  ])
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
    await refreshCalendarDetailAfterAction()
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
    await refreshCalendarDetailAfterAction()
  } catch (caught) {
    toast.error(t('toast.payment.updateFailed'), api.mapError(caught).message)
  } finally {
    modalSubmitting.value = false
  }
}

watch(
  () => ui.calendarView,
  async (mode) => {
    focusDate.value =
      mode === 'month'
        ? dayjs(selectedDate.value).startOf('month').format('YYYY-MM-DD')
        : dayjs(selectedDate.value).format('YYYY-MM-DD')

    await syncCalendarPanel()
  },
)

function orderActions(order: CalendarOrder): CalendarOrderAction[] {
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

async function handleOrderAction(order: CalendarOrder, action: CalendarOrderAction) {
  if (action.id === 'complete-delivery') {
    actionSubmittingOrderId.value = order.orderId
    try {
      await api.post(`/orders/${order.orderId}/complete-delivery`)
      toast.success(t('toast.delivery.completed'))
      await refreshCalendarDetailAfterAction()
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

onMounted(() => {
  const today = isoDate(new Date())
  selectedDate.value = today
  focusDate.value = today
  void syncCalendarPanel()
})
</script>

<template>
  <div class="space-y-4 lg:space-y-6">
    <CalendarPageSkeleton v-if="loading" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="syncCalendarPanel">{{ t('common.retry') }}</UiButton>
    </ErrorState>
    <div v-else class="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(0,1fr)] xl:gap-6">
      <div class="space-y-4">
        <CalendarBoard
          :marker-days="markerDays"
          :mode="ui.calendarView"
          :focus-date="focusDate"
          :selected-date="selectedDate"
          :selected-price="selectedPrice"
          :selected-price-loading="selectedPriceLoading"
          :selected-price-error="selectedPriceError"
          @select="selectDate"
          @period-change="changeMonth"
          @mode-change="ui.calendarView = $event"
        />
      </div>

      <div class="space-y-4">
        <!-- Day Detail Skeleton -->
        <template v-if="dayDetailLoading">
          <GlassCard class="overflow-hidden animate-pulse">
            <div class="flex items-center justify-between gap-3 border-b border-white/70 px-4 py-3.5 sm:px-5 sm:py-4">
              <div class="h-5 w-28 rounded-md bg-slate-200/70" />
              <div class="h-7 w-20 rounded-full bg-slate-200/60" />
            </div>
            <div class="space-y-3 p-3 sm:p-4">
              <div v-for="i in 2" :key="i" class="h-24 rounded-2xl bg-slate-200/50" />
            </div>
          </GlassCard>
          <GlassCard class="animate-pulse p-4 sm:p-5">
            <div class="h-5 w-40 rounded-md bg-slate-200/70" />
            <div class="mt-3 space-y-2">
              <div class="h-16 rounded-2xl bg-slate-200/50" />
              <div class="h-16 rounded-2xl bg-slate-200/50" />
            </div>
          </GlassCard>
        </template>

        <!-- Day Detail Content -->
        <template v-else>
        <GlassCard class="overflow-hidden !px-2 sm:!px-6">
          <div class="flex items-center justify-between gap-2 border-b border-white/70 px-4 py-3.5 sm:px-5 sm:py-4">
            <div class="flex items-center gap-3">
              <div>
                <p class="text-[10px] uppercase tracking-wide text-ink-500">{{ t('common.orders') }}</p>
                <p class="text-sm font-bold text-ink-900">{{ orderCountLabel }}</p>
              </div>
              <div class="h-8 w-px bg-white/70" />
              <div>
                <p class="text-[10px] uppercase tracking-wide text-ink-500">{{ t('common.total') }}</p>
                <p class="text-sm font-bold text-ink-900">{{ formatKg(selectedDay.events.orders.reduce((sum, o) => sum + Number(o.quantityKg), 0)) }} kg</p>
              </div>
            </div>
            <UiBadge tone="neutral">{{ selectedDateLabel }}</UiBadge>
          </div>

          <CalendarOrderList
            :orders="selectedDay.events.orders"
            :order-actions="orderActions"
            :action-submitting-order-id="actionSubmittingOrderId"
            @action="handleOrderAction"
          />
        </GlassCard>

        <GlassCard class="p-4 sm:p-5">
          <p class="text-base font-semibold text-ink-900">{{ t('calendar.productionExpense') }}</p>

          <div class="mt-3 space-y-2 text-sm text-ink-700">
            <div class="rounded-2xl border border-white/70 bg-white/80 p-3">
              <p class="text-xs uppercase tracking-wide text-ink-500">{{ t('calendar.marker.production') }}</p>
              <div v-if="selectedDay.events.productions.length" class="mt-2 space-y-1.5">
                <div
                  v-for="production in selectedDay.events.productions"
                  :key="production.coopId"
                  class="flex items-center justify-between gap-3"
                >
                  <span class="font-medium text-ink-800">{{ production.coopName }}</span>
                  <span>{{ formatKg(production.totalGoodKg) }} kg</span>
                </div>
              </div>
              <p v-else class="mt-2 text-ink-500">{{ t('calendar.noProduction') }}</p>
            </div>

            <div class="rounded-2xl border border-white/70 bg-white/80 p-3">
              <p class="text-xs uppercase tracking-wide text-ink-500">{{ t('calendar.marker.expense') }}</p>
              <div v-if="selectedDay.events.expenses.length" class="mt-2 space-y-1">
                <button
                  v-for="expense in selectedDay.events.expenses"
                  :key="expense.coopId"
                  type="button"
                  class="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-ink-100/60 active:bg-ink-100"
                  @click="openCoopExpenseDetail(expense)"
                >
                  <span class="truncate font-medium text-ink-800">{{ expense.coopName }}</span>
                  <span class="shrink-0 whitespace-nowrap">{{ formatRupiah(expense.totalAmount) }}</span>
                </button>
              </div>
              <p v-else class="mt-2 text-ink-500">{{ t('calendar.noExpense') }}</p>
            </div>

            <div v-if="generalExpensesByOwner.length" class="rounded-2xl border border-white/70 bg-white/80 p-3">
              <p class="text-xs uppercase tracking-wide text-ink-500">{{ t('calendar.marker.generalExpense') }}</p>
              <div class="mt-2 space-y-1">
                <button
                  v-for="group in generalExpensesByOwner"
                  :key="group.ownerName"
                  type="button"
                  class="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-ink-100/60 active:bg-ink-100"
                  @click="openGeneralExpenseDetail(group.ownerName, group.items, group.total)"
                >
                  <span class="truncate font-medium text-ink-800">{{ group.ownerName }}</span>
                  <span class="shrink-0 whitespace-nowrap">{{ formatRupiah(group.total) }}</span>
                </button>
              </div>
            </div>

            <div class="rounded-2xl border border-white/70 bg-white/80 p-3">
              <p class="text-xs uppercase tracking-wide text-ink-500">{{ t('calendar.marker.coopHealth') }}</p>
              <div v-if="selectedDay.events.coopHealth?.length" class="mt-2 space-y-1.5">
                <div
                  v-for="record in selectedDay.events.coopHealth"
                  :key="`${record.coopId}-${record.type}-${record.description}`"
                  class="flex items-center justify-between gap-3"
                >
                  <span class="font-medium text-ink-800">{{ t(`coopHealth.type.${record.type}`) }} — {{ record.coopName }}</span>
                </div>
              </div>
              <p v-else class="mt-2 text-ink-500">{{ t('coopHealth.emptyForDate') }}</p>
            </div>
          </div>
        </GlassCard>
        </template>
      </div>
    </div>

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

    <!-- Expense Detail Dialog -->
    <UiDialog
      v-model:open="expenseDetailOpen"
      :title="expenseDetailTitle"
    >
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium text-ink-700">{{ expenseDetailSubtitle }}</span>
          <span class="text-xs text-ink-400">{{ expenseDetailDate }}</span>
        </div>

        <div class="max-h-[50vh] space-y-1.5 overflow-y-auto">
          <div
            v-for="(item, idx) in expenseDetailItems"
            :key="idx"
            class="flex items-center justify-between gap-3 rounded-lg bg-ink-50/50 px-3 py-2"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-ink-800">{{ item.description }}</p>
              <p v-if="item.categoryName" class="text-xs text-ink-400">{{ item.categoryName }}</p>
            </div>
            <span class="shrink-0 text-sm font-semibold text-ink-900 whitespace-nowrap">{{ formatRupiah(item.amount) }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-ink-100 pt-3">
          <span class="text-sm font-medium text-ink-600">Total</span>
          <span class="text-base font-bold text-ink-900">{{ formatRupiah(expenseDetailTotal) }}</span>
        </div>
      </div>
    </UiDialog>
  </div>
</template>


