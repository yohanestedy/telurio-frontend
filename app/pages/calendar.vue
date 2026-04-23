<script setup lang="ts">
import dayjs from 'dayjs'
import type { CalendarDay } from '../types/domain'

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

const loading = ref(true)
const error = ref('')
const days = ref<CalendarDay[]>([])
const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const focusDate = ref(dayjs().startOf('month').format('YYYY-MM-DD'))
const selectedDay = ref<CalendarDay>(emptyCalendarDay(selectedDate.value))
const actionSubmittingOrderId = ref('')

const viewOptions = [
  { label: 'Daily', value: 'day' as const },
  { label: 'Weekly', value: 'week' as const },
  { label: 'Monthly', value: 'month' as const },
]

const boardTransitionKey = computed(
  () => `${ui.calendarView}-${focusDate.value}-${selectedDate.value}`,
)

type CalendarOrder = CalendarDay['events']['orders'][number]
type OrderAction = {
  id: 'start-delivery' | 'complete-delivery' | 'payment-update' | 'open-detail'
  label: string
  icon: 'package' | 'chevronRight' | 'money' | 'search'
  variant: 'primary' | 'secondary' | 'ghost'
}

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

const markerLegend = [
  { label: 'Order', className: 'bg-brand-500' },
  { label: 'Produksi', className: 'bg-emerald-500' },
  { label: 'Pengeluaran', className: 'bg-slate-500' },
]

async function loadCalendar() {
  loading.value = true
  error.value = ''

  const focus = dayjs(focusDate.value)
  const range =
    ui.calendarView === 'day'
      ? { start: focus.startOf('day'), end: focus.endOf('day') }
      : ui.calendarView === 'week'
        ? { start: focus.startOf('week'), end: focus.endOf('week') }
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
    days.value = await api.get<CalendarDay[]>('/calendar', {
      startDate: range.start.format('YYYY-MM-DD'),
      endDate: range.end.format('YYYY-MM-DD'),
    })
    selectedDay.value =
      days.value.find((item) => item.date === selectedDate.value) ??
      emptyCalendarDay(selectedDate.value)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
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
    await loadCalendar()
    return
  }

  try {
    selectedDay.value = await api.get<CalendarDay>(`/calendar/${date}`)
  } catch (caught) {
    error.value = api.mapError(caught).message
    selectedDay.value = emptyCalendarDay(date)
  }
}

async function changeMonth(month: string) {
  focusDate.value =
    ui.calendarView === 'month'
      ? dayjs(month).startOf('month').format('YYYY-MM-DD')
      : dayjs(month).format('YYYY-MM-DD')

  if (ui.calendarView === 'day') {
    selectedDate.value = dayjs(month).format('YYYY-MM-DD')
  }

  await loadCalendar()
}

watch(
  () => ui.calendarView,
  async (mode) => {
    focusDate.value =
      mode === 'month'
        ? dayjs(selectedDate.value).startOf('month').format('YYYY-MM-DD')
        : dayjs(selectedDate.value).format('YYYY-MM-DD')

    await loadCalendar()
  },
)

function orderActions(order: CalendarOrder): OrderAction[] {
  const actions: OrderAction[] = []

  if (can('orders.deliver') && order.deliveryStatus === 'BELUM_DIHANTAR') {
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

async function handleOrderAction(order: CalendarOrder, action: OrderAction) {
  if (action.id === 'complete-delivery') {
    actionSubmittingOrderId.value = order.orderId
    try {
      await api.post(`/orders/${order.orderId}/complete-delivery`)
      toast.success('Pengantaran berhasil diselesaikan')
      await Promise.all([loadCalendar(), selectDate(selectedDate.value)])
    } catch (caught) {
      toast.error('Gagal menyelesaikan pengantaran', api.mapError(caught).message)
    } finally {
      actionSubmittingOrderId.value = ''
    }
    return
  }

  if (action.id === 'start-delivery') {
    await navigateTo({
      path: `/orders/${order.orderId}`,
      query: { open: 'start-delivery' },
    })
    return
  }

  if (action.id === 'payment-update') {
    await navigateTo({
      path: `/orders/${order.orderId}`,
      query: { open: 'payment-update' },
    })
    return
  }

  await navigateTo({
    path: `/orders/${order.orderId}`,
  })
}

onMounted(loadCalendar)
</script>

<template>
  <div class="space-y-4 lg:space-y-6">
    <LoadingSkeleton v-if="loading" :lines="8" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="loadCalendar">Coba lagi</UiButton>
    </ErrorState>
    <div v-else class="grid gap-4 xl:grid-cols-[1.25fr_1fr] xl:gap-6">
      <div class="space-y-4">
        <GlassCard class="p-4 sm:p-5">
          <div class="flex w-full items-center rounded-2xl border border-white/80 bg-white/80 p-1">
            <button
              v-for="option in viewOptions"
              :key="option.value"
              type="button"
              :class="[
                'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition',
                ui.calendarView === option.value
                  ? 'bg-brand-500 text-white shadow-[0_8px_18px_rgba(243,95,16,0.26)]'
                  : 'text-ink-600 hover:bg-white',
              ]"
              @click="ui.calendarView = option.value"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-600">
            <!-- <span class="font-semibold uppercase tracking-wide text-ink-500">Marker</span> -->
            <span
              v-for="item in markerLegend"
              :key="item.label"
              class="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-2.5 py-1"
            >
              <span :class="['h-2 w-2 rounded-full', item.className]" />
              {{ item.label }}
            </span>
          </div>
        </GlassCard>

        <Transition name="calendar-swap" mode="out-in">
          <CalendarBoard
            :key="boardTransitionKey"
            :days="days"
            :mode="ui.calendarView"
            :focus-date="focusDate"
            :selected-date="selectedDate"
            @select="selectDate"
            @period-change="changeMonth"
          />
        </Transition>
      </div>

      <div class="space-y-4">
        <GlassCard class="p-4 sm:p-5">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <p class="text-base font-semibold text-ink-900">Order Actions</p>
              <p class="text-xs text-ink-500">{{ formatDate(selectedDate) }}</p>
            </div>
            <span class="rounded-full border border-white/70 bg-white/80 px-2 py-1 text-xs text-ink-600">
              {{ selectedDay.events.orders.length }} order
            </span>
          </div>

          <div v-if="selectedDay.events.orders.length" class="space-y-3">
            <article
              v-for="order in selectedDay.events.orders"
              :key="order.orderId"
              class="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-base font-semibold text-ink-900">{{ order.customerName }}</p>
                  <p class="mt-1 text-sm text-ink-600">{{ formatKg(order.quantityKg) }} kg</p>
                </div>

                <div class="flex flex-wrap justify-end gap-1.5">
                  <StatusChip compact kind="delivery" :value="order.deliveryStatus" />
                  <StatusChip compact kind="payment" :value="order.paymentStatus" />
                </div>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <UiButton
                  v-for="action in orderActions(order)"
                  :key="`${order.orderId}-${action.id}`"
                  :variant="action.variant"
                  size="sm"
                  :icon="action.icon"
                  :disabled="actionSubmittingOrderId === order.orderId"
                  @click="handleOrderAction(order, action)"
                >
                  {{ action.label }}
                </UiButton>
              </div>
            </article>
          </div>
          <p v-else class="text-sm text-ink-500">Tidak ada order di tanggal ini.</p>
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
