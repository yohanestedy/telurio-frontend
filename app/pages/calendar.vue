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
import { formatRupiah } from '../utils/formatters'
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

const boardTransitionKey = computed(
  () => `${ui.calendarView}-${focusDate.value}-${selectedDate.value}`,
)
const selectedDateLabel = computed(() => formatDayMonthYearId(selectedDate.value))
const orderCountLabel = computed(() => `${selectedDay.value.events.orders.length}`)

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

const allocationDialogTitle = computed(() =>
  allocationModalMode.value === 'edit' ? 'Ubah Alokasi Pengantaran' : 'Start Delivery',
)

const allocationDialogDescription = computed(() =>
  allocationModalMode.value === 'edit'
    ? 'Koreksi alokasi kandang. Sistem akan menyesuaikan live stock secara otomatis.'
    : 'Masukkan alokasi kandang hingga totalnya sama dengan quantity order.',
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
      })
      toast.success('Alokasi pengantaran berhasil diperbarui')
    } else {
      await api.post(`/orders/${activeOrder.value.id}/start-delivery`, payload)
      toast.success('Pengantaran berhasil dimulai')
    }

    startDeliveryOpen.value = false
    await refreshCalendarDetailAfterAction()
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

function orderActions(order: CalendarOrder): CalendarOrderAction[] {
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

async function handleOrderAction(order: CalendarOrder, action: CalendarOrderAction) {
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

          <CalendarOrderList
            :orders="selectedDay.events.orders"
            :order-actions="orderActions"
            :action-submitting-order-id="actionSubmittingOrderId"
            @action="handleOrderAction"
          />
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

</style>
