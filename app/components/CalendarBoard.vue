<script setup lang="ts">
import dayjs from 'dayjs'
import type { CalendarDay } from '../types/domain'

const props = defineProps<{
  days: CalendarDay[]
  mode: 'month' | 'week' | 'day'
  focusDate: string
  selectedDate: string
}>()

const emit = defineEmits<{
  select: [date: string]
  periodChange: [focusDate: string]
}>()

const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const dayMap = computed(() => new Map(props.days.map((day) => [day.date, day])))
const focus = computed(() => dayjs(props.focusDate))

const titleLabel = computed(() => {
  if (props.mode === 'week') {
    const start = focus.value.startOf('week')
    const end = focus.value.endOf('week')
    return `${start.format('DD MMM')} - ${end.format('DD MMM YYYY')}`
  }

  if (props.mode === 'day') {
    return focus.value.format('dddd, DD MMM YYYY')
  }

  return focus.value.startOf('month').format('MMMM YYYY')
})

const subtitleLabel = computed(() => {
  if (props.mode === 'week') {
    return 'Weekly Focus'
  }

  if (props.mode === 'day') {
    return 'Daily Focus'
  }

  return 'Monthly View'
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
  totalEvents: number
  markers: CalendarMarker[]
  weekdayLabel: string
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
  const totalEvents = markers.reduce((acc, item) => acc + item.count, 0)
  const cursor = dayjs(date)

  return {
    date,
    dayOfMonth: cursor.date(),
    inMonth,
    isSelected: date === props.selectedDate,
    totalEvents,
    markers,
    weekdayLabel: cursor.format('ddd'),
  }
}

const cells = computed(() => {
  if (props.mode === 'day') {
    return [buildCell(focus.value.format('YYYY-MM-DD'), true)]
  }

  if (props.mode === 'week') {
    const start = focus.value.startOf('week')
    return Array.from({ length: 7 }, (_, index) => {
      const cursor = start.add(index, 'day')
      return buildCell(cursor.format('YYYY-MM-DD'), true)
    })
  }

  const start = focus.value.startOf('month').startOf('week')
  const end = focus.value.endOf('month').endOf('week')
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

function goToCurrentPeriod() {
  const today = dayjs()
  const focusDate =
    props.mode === 'month' ? today.startOf('month') : today.startOf('day')

  emit('periodChange', focusDate.format('YYYY-MM-DD'))
}
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
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">{{ subtitleLabel }}</p>
          <p class="text-base font-semibold text-ink-900 sm:text-lg">{{ titleLabel }}</p>
        </div>
        <div class="flex items-center gap-2">
          <UiButton
            variant="ghost"
            size="sm"
            icon="chevronRight"
            :aria-label="nextAriaLabel"
            @click="goToNextPeriod"
          />
          <!-- <UiButton variant="secondary" size="sm" @click="goToCurrentPeriod">Today</UiButton> -->
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
          ]"
          @click="selectDay(cell.date)"
        >
          <span class="text-sm font-semibold">
            <template v-if="props.mode === 'day'">
              {{ cell.weekdayLabel }}, {{ dayjs(cell.date).format('DD MMM YYYY') }}
            </template>
            <template v-else>
              {{ cell.dayOfMonth }}
            </template>
          </span>
          <span
            v-if="cell.totalEvents > 0"
            class="absolute right-1.5 top-1.5 rounded-full bg-ink-900 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white"
          >
            {{ cell.totalEvents }}
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
    </div>
  </GlassCard>
</template>
