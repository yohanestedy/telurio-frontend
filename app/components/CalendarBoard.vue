<script setup lang="ts">
import dayjs from 'dayjs'
import type { CalendarDay, PriceItem } from '../types/domain'
import {
  endOfWeekMonday,
  formatDayMonthId,
  formatDayMonthYearId,
  formatMonthYearId,
  startOfWeekMonday,
  weekdayShortLabelId,
  weekdayLongLabelId,
} from '../utils/calendar'
import { formatRupiah } from '../utils/formatters'

const props = defineProps<{
  days: CalendarDay[]
  mode: 'month' | 'week' | 'day'
  focusDate: string
  selectedDate: string
  selectedPrice: PriceItem | null
  selectedPriceLoading?: boolean
  selectedPriceError?: boolean
}>()

const emit = defineEmits<{
  select: [date: string]
  periodChange: [focusDate: string]
  modeChange: [mode: 'month' | 'week' | 'day']
}>()

const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const viewOptions = [
  { label: 'Harian', value: 'day' as const },
  { label: 'Mingguan', value: 'week' as const },
  { label: 'Bulanan', value: 'month' as const },
]
const markerLegend = [
  { label: 'Order', className: 'bg-brand-500' },
  { label: 'Produksi', className: 'bg-emerald-500' },
  { label: 'Pengeluaran', className: 'bg-slate-500' },
]

const dayMap = computed(() => new Map(props.days.map((day) => [day.date, day])))
const focus = computed(() => dayjs(props.focusDate))
const flashedDate = ref('')
let flashTimer: ReturnType<typeof setTimeout> | null = null
const selectedDateCompactLabel = computed(
  () => `${weekdayShortLabelId(props.selectedDate)}, ${formatDayMonthId(props.selectedDate)}`,
)

const titleLabel = computed(() => {
  if (props.mode === 'week') {
    const start = startOfWeekMonday(props.focusDate)
    const end = endOfWeekMonday(props.focusDate)
    return `${formatDayMonthId(start.toDate())} - ${formatDayMonthYearId(end.toDate())}`
  }

  if (props.mode === 'day') {
    return `${weekdayLongLabelId(props.focusDate)}, ${formatDayMonthYearId(props.focusDate)}`
  }

  return formatMonthYearId(focus.value.startOf('month').toDate())
})

type CalendarMarker = {
  key: string
  label: string
  count: number
  className: string
}

type CalendarCell = {
  date: string
  dayOfMonth: number
  inMonth: boolean
  isSelected: boolean
  markers: CalendarMarker[]
}

function buildMarkers(date: string): CalendarMarker[] {
  const payload = dayMap.value.get(date)
  const orderCount = payload?.events.orders.length ?? 0
  const productionCount = payload?.events.productions.length ?? 0
  const expenseCount = payload?.events.expenses.length ?? 0
  const markers: CalendarMarker[] = []

  if (orderCount > 0) {
    markers.push({
      key: 'orders',
      label: 'Order',
      count: orderCount,
      className: 'bg-brand-500',
    })
  }

  if (productionCount > 0) {
    markers.push({
      key: 'productions',
      label: 'Produksi',
      count: productionCount,
      className: 'bg-emerald-500',
    })
  }

  if (expenseCount > 0) {
    markers.push({
      key: 'expenses',
      label: 'Pengeluaran',
      count: expenseCount,
      className: 'bg-slate-500',
    })
  }

  return markers
}

function buildCell(date: string, inMonth: boolean): CalendarCell {
  const markers = buildMarkers(date)
  const cursor = dayjs(date)

  return {
    date,
    dayOfMonth: cursor.date(),
    inMonth,
    isSelected: date === props.selectedDate,
    markers,
  }
}

const cells = computed(() => {
  if (props.mode === 'day') {
    return [buildCell(focus.value.format('YYYY-MM-DD'), true)]
  }

  if (props.mode === 'week') {
    const start = startOfWeekMonday(props.focusDate)
    return Array.from({ length: 7 }, (_, index) => {
      const cursor = start.add(index, 'day')
      return buildCell(cursor.format('YYYY-MM-DD'), true)
    })
  }

  const start = startOfWeekMonday(focus.value.startOf('month').format('YYYY-MM-DD'))
  const end = endOfWeekMonday(focus.value.endOf('month').format('YYYY-MM-DD'))
  const result: CalendarCell[] = []
  let cursor = start

  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    const date = cursor.format('YYYY-MM-DD')
    result.push(buildCell(date, cursor.isSame(focus.value, 'month')))
    cursor = cursor.add(1, 'day')
  }

  return result
})

const showWeekHeader = computed(() => props.mode !== 'day')
const gridClass = computed(() =>
  props.mode === 'day' ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-7 gap-2',
)
const previousAriaLabel = computed(() =>
  props.mode === 'month'
    ? 'Bulan sebelumnya'
    : props.mode === 'week'
      ? 'Minggu sebelumnya'
      : 'Hari sebelumnya',
)
const nextAriaLabel = computed(() =>
  props.mode === 'month'
    ? 'Bulan berikutnya'
    : props.mode === 'week'
      ? 'Minggu berikutnya'
      : 'Hari berikutnya',
)

function selectDay(date: string) {
  flashedDate.value = date
  if (flashTimer) {
    clearTimeout(flashTimer)
  }

  flashTimer = setTimeout(() => {
    flashedDate.value = ''
    flashTimer = null
  }, 240)

  emit('select', date)
}

function goToPreviousPeriod() {
  const next =
    props.mode === 'month'
      ? focus.value.subtract(1, 'month')
      : props.mode === 'week'
        ? focus.value.subtract(1, 'week')
        : focus.value.subtract(1, 'day')

  emit('periodChange', next.format('YYYY-MM-DD'))
}

function goToNextPeriod() {
  const next =
    props.mode === 'month'
      ? focus.value.add(1, 'month')
      : props.mode === 'week'
        ? focus.value.add(1, 'week')
        : focus.value.add(1, 'day')

  emit('periodChange', next.format('YYYY-MM-DD'))
}

function changeMode(mode: 'month' | 'week' | 'day') {
  emit('modeChange', mode)
}

onBeforeUnmount(() => {
  if (flashTimer) {
    clearTimeout(flashTimer)
  }
})
</script>

<template>
  <GlassCard class="p-4 sm:p-5">
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/75 px-3 py-2.5">
        <UiButton
          variant="ghost"
          size="sm"
          icon="chevronLeft"
          :aria-label="previousAriaLabel"
          @click="goToPreviousPeriod"
        />
        <div class="text-center">
          <p class="text-sm font-semibold text-ink-900 sm:text-lg">{{ titleLabel }}</p>
        </div>
        <UiButton
          variant="ghost"
          size="sm"
          icon="chevronRight"
          :aria-label="nextAriaLabel"
          @click="goToNextPeriod"
        />
      </div>

      <div class="flex flex-col gap-3 md:flex-row md:items-center">
        <div class="flex w-full items-center rounded-2xl border border-white/80 bg-white/80 p-1 md:flex-1">
          <button
            v-for="option in viewOptions"
            :key="option.value"
            type="button"
            :class="[
              'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition',
              props.mode === option.value
                ? 'bg-brand-500 text-white shadow-[0_8px_18px_rgba(243,95,16,0.26)]'
                : 'text-ink-600 hover:bg-white',
            ]"
            @click="changeMode(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="rounded-2xl border border-brand-100/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,248,243,0.9))] px-3 py-2.5 shadow-[0_10px_24px_rgba(243,95,16,0.08)] md:min-w-[255px]">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-700">
              <UiIcon name="prices" class="h-4 w-4" />
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">Harga aktif</p>

              <div v-if="props.selectedPriceLoading" class="mt-1.5 flex items-center gap-2">
                <div class="h-4 w-24 animate-pulse rounded-md bg-slate-200/70" />
                <div class="h-3 w-12 animate-pulse rounded-md bg-slate-200/55" />
              </div>

              <template v-else-if="props.selectedPrice">
                <p class="mt-1 text-sm font-semibold text-ink-900 sm:text-[15px]">
                  {{ formatRupiah(props.selectedPrice.pricePerKg) }}
                  <span class="text-[11px] font-medium text-ink-500">/kg</span>
                </p>
              </template>

              <p v-else class="mt-1 text-xs font-medium text-ink-600">
                {{ props.selectedPriceError ? 'Harga belum bisa dimuat' : 'Belum tersedia' }}
              </p>
            </div>

            <div class="shrink-0 text-right">
              <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Terpilih</p>
              <p class="mt-1 text-xs font-medium leading-tight text-ink-700">
                {{ selectedDateCompactLabel }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showWeekHeader" class="grid grid-cols-7 gap-2">
        <span
          v-for="label in weekDays"
          :key="label"
          class="text-center text-[11px] font-medium uppercase tracking-wide text-ink-500"
        >
          {{ label }}
        </span>
      </div>

      <div :class="gridClass">
        <button
          v-for="cell in cells"
          :key="cell.date"
          type="button"
          :class="[
            'relative flex rounded-2xl border transition',
            props.mode === 'day'
              ? 'h-28 flex-col items-start justify-between p-4 text-left'
              : 'h-16 flex-col items-center justify-center sm:h-20',
            cell.inMonth ? 'border-white/75 bg-white/92 text-ink-900 hover:border-brand-300' : 'border-white/50 bg-white/45 text-ink-400',
            cell.isSelected ? 'ring-2 ring-brand-400/80 ring-offset-2 ring-offset-white/20' : '',
            flashedDate === cell.date ? 'calendar-cell-flash' : '',
          ]"
          @click="selectDay(cell.date)"
        >
          <span class="text-sm font-semibold">
            <template v-if="props.mode === 'day'">
              {{ weekdayLongLabelId(cell.date) }}, {{ formatDayMonthYearId(cell.date) }}
            </template>
            <template v-else>
              {{ cell.dayOfMonth }}
            </template>
          </span>

          <div
            :class="[
              'flex min-h-2 items-center gap-1',
              props.mode === 'day' ? 'mt-2' : 'mt-1.5 justify-center',
            ]"
          >
            <span
              v-for="marker in cell.markers"
              :key="`${cell.date}-${marker.key}`"
              :title="`${marker.label}: ${marker.count}`"
              :class="[
                'rounded-full',
                props.mode === 'day' ? 'h-2 w-2' : 'h-1.5 w-1.5',
                marker.className,
              ]"
            />

            <span
              v-if="props.mode === 'day' && !cell.markers.length"
              class="text-xs text-ink-500"
            >
              Tidak ada agenda.
            </span>
          </div>
        </button>
      </div>

      <div class="border-t border-white/70 pt-3">
        <div class="flex flex-wrap items-center gap-3 text-xs text-ink-600">
          <span
            v-for="item in markerLegend"
            :key="item.label"
            class="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-2.5 py-1"
          >
            <span :class="['h-2 w-2 rounded-full', item.className]" />
            {{ item.label }}
          </span>
        </div>
      </div>
    </div>
  </GlassCard>
</template>

<style scoped>
.calendar-cell-flash {
  animation: calendarCellFlash 0.24s ease;
}

@keyframes calendarCellFlash {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(243, 95, 16, 0.25);
  }

  55% {
    transform: scale(0.985);
    box-shadow: 0 0 0 8px rgba(243, 95, 16, 0.1);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(243, 95, 16, 0);
  }
}
</style>
