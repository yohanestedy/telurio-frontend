<script setup lang="ts">
import dayjs from 'dayjs'
import type {
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
import { formatRupiah } from '../utils/formatters'

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

const loading = ref(true)
const error = ref('')
const markerDays = ref<CalendarMarkerDay[]>([])
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const focusDate = ref(dayjs().format('YYYY-MM-DD'))
const selectedDay = ref<CalendarDay>(emptyCalendarDay(selectedDate.value))
const actionSubmittingOrderId = ref('')
const modalSubmitting = ref(false)
const startDeliveryOpen = ref(false)
const paymentOpen = ref(false)
const startModalLoading = ref(false)
const paymentModalLoading = ref(false)
const activeOrder = ref<OrderItem | null>(null)
const activeCoops = ref<CoopItem[]>([])
const activeLiveStock = ref<LiveStockResponse | null>(null)
const selectedPrice = ref<PriceItem | null>(null)
const selectedPriceLoading = ref(false)
const selectedPriceError = ref(false)

const boardTransitionKey = computed(
  () => `${ui.calendarView}-${focusDate.value}-${selectedDate.value}`,
)
const selectedDateLabel = computed(() => formatDayMonthYearId(selectedDate.value))
const orderCountLabel = computed(() => `${selectedDay.value.events.orders.length}`)

type CalendarOrder = CalendarDay['events']['orders'][number]
type OrderAction = {
  id: 'start-delivery' | 'complete-delivery' | 'payment-update' | 'open-detail'
  label: string
  icon: 'package' | 'chevronRight' | 'money' | 'search'
  variant: 'primary' | 'secondary' | 'ghost'
}

const deliveryPriority: Record<CalendarOrder['deliveryStatus'], number> = {
  BELUM_DIHANTAR: 0,
  SEDANG_DIHANTAR: 1,
  SUDAH_DIHANTAR: 4,
}

const paymentPriority: Record<CalendarOrder['paymentStatus'], number> = {
  BELUM_BAYAR: 2,
  DP: 3,
  LUNAS: 4,
}

const sortedSelectedOrders = computed(() =>
  [...selectedDay.value.events.orders].sort((left, right) => {
    const leftPrimary = Math.min(
      deliveryPriority[left.deliveryStatus] ?? 99,
      paymentPriority[left.paymentStatus] ?? 99,
    )
    const rightPrimary = Math.min(
      deliveryPriority[right.deliveryStatus] ?? 99,
      paymentPriority[right.paymentStatus] ?? 99,
    )

    if (leftPrimary !== rightPrimary) {
      return leftPrimary - rightPrimary
    }

    const leftDelivery = deliveryPriority[left.deliveryStatus] ?? 99
    const rightDelivery = deliveryPriority[right.deliveryStatus] ?? 99
    if (leftDelivery !== rightDelivery) {
      return leftDelivery - rightDelivery
    }

    const leftPayment = paymentPriority[left.paymentStatus] ?? 99
    const rightPayment = paymentPriority[right.paymentStatus] ?? 99
    if (leftPayment !== rightPayment) {
      return leftPayment - rightPayment
    }

    return left.customerName.localeCompare(right.customerName)
  }),
)

function emptyCalendarDay(date: string): CalendarDay {
  return {
    date,
    events: {
      orders: [],
      productions: [],
      expenses: [],
      priceUpdates: [],
    },
  }
}

const activeCoopOptions = computed(() =>
  activeCoops.value.map((item) => ({ label: item.name, value: item.id })),
)

const activeOrderIsTodayDelivery = computed(() => {
  if (!activeOrder.value) {
    return false
  }

  return dayjs(activeOrder.value.deliveryDate).startOf('day').isSame(dayjs().startOf('day'))
})

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

async function syncCalendarPanel() {
  await loadCalendar()
  await Promise.all([
    loadSelectedDayDetail(selectedDate.value),
    loadSelectedPriceForDate(selectedDate.value),
  ])
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
      loadSelectedDayDetail(selectedDate.value),
      loadSelectedPriceForDate(selectedDate.value),
    ])
    return
  }

  await Promise.all([
    loadSelectedDayDetail(selectedDate.value),
    loadSelectedPriceForDate(selectedDate.value),
  ])
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

async function openStartDeliveryModal(orderId: string) {
  startModalLoading.value = true

  try {
    const [orderDetail, coopList, stock] = await Promise.all([
      loadOrderForAction(orderId),
      api.getPage<CoopItem[]>('/coops', { all: true }),
      api.get<LiveStockResponse>('/stocks/live'),
      loadTodayPriceStatus(),
    ])

    activeOrder.value = orderDetail
    activeCoops.value = coopList.data
    activeLiveStock.value = stock
    startDeliveryOpen.value = true
  } catch (caught) {
    toast.error('Gagal menyiapkan modal pengantaran', api.mapError(caught).message)
  } finally {
    startModalLoading.value = false
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

async function refreshCalendarDetailAfterAction() {
  await loadCalendar()

  await Promise.all([
    loadSelectedDayDetail(selectedDate.value),
    loadSelectedPriceForDate(selectedDate.value),
  ])
}

async function submitStartDelivery(payload: { allocations: Array<{ coopId: string; quantityKg: number }>; customPricePerKg?: number }) {
  if (!activeOrder.value) {
    return
  }

  modalSubmitting.value = true
  try {
    await api.post(`/orders/${activeOrder.value.id}/start-delivery`, payload)
    toast.success('Pengantaran berhasil dimulai')
    startDeliveryOpen.value = false
    await refreshCalendarDetailAfterAction()
  } catch (caught) {
    toast.error('Gagal memulai pengantaran', api.mapError(caught).message)
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
    await refreshCalendarDetailAfterAction()
  } catch (caught) {
    toast.error('Gagal update pembayaran', api.mapError(caught).message)
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

function orderActions(order: CalendarOrder): OrderAction[] {
  const actions: OrderAction[] = []

  if (auth.role === 'OPERATOR' && order.deliveryStatus === 'BELUM_DIHANTAR') {
    actions.push({
      id: 'start-delivery',
      label: 'Mulai Hantar',
      icon: 'package',
      variant: 'primary',
    })
  }

  if (auth.role === 'OPERATOR' && order.deliveryStatus === 'SEDANG_DIHANTAR') {
    actions.push({
      id: 'complete-delivery',
      label: 'Selesai Hantar',
      icon: 'chevronRight',
      variant: 'secondary',
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
    label: 'Detail',
    icon: 'search',
    variant: 'ghost',
  })

  return actions
}

function orderPriceLabel(pricePerKg: string | null) {
  return pricePerKg ? formatRupiah(pricePerKg) : 'Belum dikunci'
}

function orderInvoiceLabel(totalInvoice: string | null) {
  return totalInvoice ? formatRupiah(totalInvoice) : 'Invoice belum dihitung'
}

function isCompletedDelivery(order: CalendarOrder) {
  return order.deliveryStatus === 'SUDAH_DIHANTAR'
}

function deliveryAccentClass(order: CalendarOrder) {
  if (order.deliveryStatus === 'SUDAH_DIHANTAR') {
    return 'bg-[linear-gradient(90deg,#10B981,#34D399)]'
  }

  if (order.deliveryStatus === 'SEDANG_DIHANTAR') {
    return 'bg-[linear-gradient(90deg,#3B82F6,#60A5FA)]'
  }

  return 'bg-[linear-gradient(90deg,#F59E0B,#FCD34D)]'
}

async function handleOrderAction(order: CalendarOrder, action: OrderAction) {
  if (action.id === 'complete-delivery') {
    actionSubmittingOrderId.value = order.orderId
    try {
      await api.post(`/orders/${order.orderId}/complete-delivery`)
      toast.success('Pengantaran berhasil diselesaikan')
      await refreshCalendarDetailAfterAction()
    } catch (caught) {
      toast.error('Gagal menyelesaikan pengantaran', api.mapError(caught).message)
    } finally {
      actionSubmittingOrderId.value = ''
    }
    return
  }

  if (action.id === 'start-delivery') {
    await openStartDeliveryModal(order.orderId)
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

onMounted(syncCalendarPanel)
</script>

<template>
  <div class="space-y-4 lg:space-y-6">
    <CalendarPageSkeleton v-if="loading" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="syncCalendarPanel">Coba lagi</UiButton>
    </ErrorState>
    <div v-else class="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(0,1fr)] xl:gap-6">
      <div class="space-y-4">
        <Transition name="calendar-swap" mode="out-in">
          <CalendarBoard
            :key="boardTransitionKey"
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
        </Transition>
      </div>

      <div class="space-y-4">
        <GlassCard class="overflow-hidden">
          <div class="flex items-center justify-between gap-2 border-b border-white/70 px-4 py-3.5 sm:px-5 sm:py-4">
            <div>
              <p class="text-base font-semibold text-ink-900">{{ orderCountLabel }} Pesanan</p>
            </div>
            <span class="rounded-full border border-white/70 bg-white/80 px-2 py-1 text-xs text-ink-600">
              {{ selectedDateLabel }}
            </span>
          </div>

          <TransitionGroup
            v-if="sortedSelectedOrders.length"
            name="order-stagger"
            tag="div"
            class="space-y-3 p-3 sm:p-4"
          >
            <article
              v-for="(order, index) in sortedSelectedOrders"
              :key="order.orderId"
              class="order-action-card overflow-hidden rounded-[24px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,249,243,0.94))] shadow-[0_18px_32px_rgba(15,23,42,0.08)]"
              :style="{ '--order-delay': `${index * 45}ms` }"
            >
              <div :class="['h-1.5', deliveryAccentClass(order)]" />

              <div class="p-3.5 sm:p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-extrabold tracking-[-0.01em] text-ink-900 sm:text-base">
                      {{ order.customerName }}
                    </p>
                  </div>

                  <StatusChip compact kind="delivery" :value="order.deliveryStatus" />
                </div>

                <div class="mt-3 rounded-[18px] border border-white/80 bg-white/72 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                  <div class="grid grid-cols-3 gap-2">
                    <div class="text-center">
                      <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                        Jumlah
                      </p>
                      <div class="mt-1 flex items-end justify-center gap-1">
                        <span class="text-lg font-black leading-none tracking-tight text-brand-700 sm:text-xl">
                          {{ formatKg(order.quantityKg) }}
                        </span>
                        <span class="pb-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-500">
                          kg
                        </span>
                      </div>
                    </div>

                    <div class="text-center">
                      <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                        Harga/Kg
                      </p>
                      <p class="mt-1 text-[11px] font-semibold leading-tight text-ink-800 sm:text-[13px]">
                        {{ orderPriceLabel(order.pricePerKg) }}
                      </p>
                    </div>

                    <div class="text-center">
                      <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                        Total
                      </p>
                      <p class="mt-1 text-[11px] font-black leading-tight text-brand-700 sm:text-[13px]">
                        {{ orderInvoiceLabel(order.totalInvoice) }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="mt-3 flex items-center gap-2">
                  <span class="text-[11px] font-medium text-ink-500">Pembayaran:</span>
                  <StatusChip compact kind="payment" :value="order.paymentStatus" />
                </div>

                <div class="my-3 h-px bg-slate-200/80" />

                <div class="flex flex-wrap gap-2">
                  <div
                    v-if="isCompletedDelivery(order)"
                    class="flex min-w-[130px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700"
                  >
                    <span>✓</span>
                    <span>Terhantar</span>
                  </div>

                  <UiButton
                    v-for="action in orderActions(order)"
                    :key="`${order.orderId}-${action.id}`"
                    :variant="action.variant"
                    size="sm"
                    :icon="action.icon"
                    :class="[
                      'transition-transform duration-150 active:scale-[0.97] text-[11px] sm:text-xs',
                      action.id === 'start-delivery' || action.id === 'complete-delivery'
                        ? 'min-w-[140px] flex-1'
                        : '',
                    ]"
                    :disabled="actionSubmittingOrderId === order.orderId"
                    @click="handleOrderAction(order, action)"
                  >
                    {{ action.label }}
                  </UiButton>
                </div>
              </div>
            </article>
          </TransitionGroup>
          <p v-else class="p-4 text-sm text-ink-500 sm:p-5">Tidak ada order di tanggal ini.</p>
        </GlassCard>

        <GlassCard class="p-4 sm:p-5">
          <p class="text-base font-semibold text-ink-900">Produksi & Pengeluaran</p>

          <div class="mt-3 space-y-2 text-sm text-ink-700">
            <div class="rounded-2xl border border-white/70 bg-white/80 p-3">
              <p class="text-xs uppercase tracking-wide text-ink-500">Produksi</p>
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
              <p v-else class="mt-2 text-ink-500">Tidak ada produksi.</p>
            </div>

            <div class="rounded-2xl border border-white/70 bg-white/80 p-3">
              <p class="text-xs uppercase tracking-wide text-ink-500">Pengeluaran</p>
              <div v-if="selectedDay.events.expenses.length" class="mt-2 space-y-1.5">
                <div
                  v-for="expense in selectedDay.events.expenses"
                  :key="expense.coopId"
                  class="flex items-center justify-between gap-3"
                >
                  <span class="font-medium text-ink-800">{{ expense.coopName }}</span>
                  <span>{{ formatRupiah(expense.totalAmount) }}</span>
                </div>
              </div>
              <p v-else class="mt-2 text-ink-500">Tidak ada pengeluaran.</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>

    <UiDialog
      v-model:open="startDeliveryOpen"
      title="Start Delivery"
      description="Masukkan alokasi kandang hingga totalnya sama dengan quantity order."
      size="xl"
    >
      <LoadingSkeleton v-if="startModalLoading" :lines="6" />
      <FormsDeliveryAllocationForm
        v-else-if="activeOrder"
        :coop-options="activeCoopOptions"
        :order-quantity-kg="activeOrder.quantityKg"
        :order-price-per-kg="activeOrder.pricePerKg"
        :today-price-per-kg="currentPrice?.pricePerKg ?? null"
        :can-set-price-now="activeOrderIsTodayDelivery"
        :combined-available-kg="activeLiveStock?.combinedAvailableKg ?? null"
        :coop-stocks="activeLiveStock?.coops ?? []"
        :submitting="modalSubmitting"
        @submit="submitStartDelivery"
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
  </div>
</template>

<style scoped>
.calendar-swap-enter-active,
.calendar-swap-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.calendar-swap-enter-from,
.calendar-swap-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.995);
}

.order-action-card {
  transform: translateZ(0);
  transition: transform 0.18s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.order-action-card:active {
  transform: scale(0.988);
}

.order-stagger-enter-active,
.order-stagger-leave-active {
  transition:
    opacity 0.32s ease,
    transform 0.32s ease;
  transition-delay: var(--order-delay, 0ms);
}

.order-stagger-enter-from,
.order-stagger-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}
</style>
