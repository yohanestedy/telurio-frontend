<script setup lang="ts">
import dayjs from 'dayjs'
import type { CalendarMarkerDay, PriceItem } from '../types/domain'
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
const { t } = useI18n()

const props = defineProps<{
  markerDays: CalendarMarkerDay[]
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

const weekDays = computed(() => {
  const start = startOfWeekMonday(props.focusDate)
  return Array.from({ length: 7 }, (_, index) => weekdayShortLabelId(start.add(index, 'day').toDate()))
})
const viewOptions = computed(() => [
  { label: t('calendar.view.day'), value: 'day' as const },
  { label: t('calendar.view.week'), value: 'week' as const },
  { label: t('calendar.view.month'), value: 'month' as const },
])
const markerLegend = computed(() => [
  { label: t('calendar.marker.order'), className: 'bg-brand-500 dark:!bg-brand-300' },
  { label: t('calendar.marker.production'), className: 'bg-emerald-500 dark:!bg-emerald-300' },
  { label: t('calendar.marker.expense'), className: 'bg-slate-500 dark:!bg-slate-300' },
  { label: t('calendar.marker.generalExpense'), className: 'bg-indigo-400 dark:!bg-indigo-300' },
])

const markerMap = computed(() => new Map(props.markerDays.map((day) => [day.date, day.markers])))
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
  const payload = markerMap.value.get(date)
  const orderCount = payload?.orders ?? 0
  const productionCount = payload?.productions ?? 0
  const expenseCount = payload?.expenses ?? 0
  const markers: CalendarMarker[] = []

  if (orderCount > 0) {
    markers.push({
      key: 'orders',
      label: t('calendar.marker.order'),
      count: orderCount,
      className: 'bg-brand-500 dark:!bg-brand-300',
    })
  }

  if (productionCount > 0) {
    markers.push({
      key: 'productions',
      label: t('calendar.marker.production'),
      count: productionCount,
      className: 'bg-emerald-500 dark:!bg-emerald-300',
    })
  }

  if (expenseCount > 0) {
    markers.push({
      key: 'expenses',
      label: t('calendar.marker.expense'),
      count: expenseCount,
      className: 'bg-slate-500 dark:!bg-slate-300',
    })
  }

  const generalExpenseCount = payload?.generalExpenses ?? 0
  if (generalExpenseCount > 0) {
    markers.push({
      key: 'generalExpenses',
      label: t('calendar.marker.generalExpense'),
      count: generalExpenseCount,
      className: 'bg-indigo-400 dark:!bg-indigo-300',
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
    ? t('calendar.previous.month')
    : props.mode === 'week'
      ? t('calendar.previous.week')
      : t('calendar.previous.day'),
)
const nextAriaLabel = computed(() =>
  props.mode === 'month'
    ? t('calendar.next.month')
    : props.mode === 'week'
      ? t('calendar.next.week')
      : t('calendar.next.day'),
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

const legendOpen = ref(false)
const legendRef = ref<HTMLElement | null>(null)
const legendButtonRef = ref<HTMLElement | null>(null)
const legendPopoverRef = ref<HTMLElement | null>(null)
const legendPopoverStyle = ref<Record<string, string>>({})

function updateLegendPopoverPosition() {
  const button = legendButtonRef.value
  if (!button || typeof window === 'undefined') {
    return
  }

  const rect = button.getBoundingClientRect()
  const width = 208
  const margin = 12
  const left = Math.min(Math.max(rect.right - width, margin), window.innerWidth - width - margin)

  legendPopoverStyle.value = {
    left: `${left}px`,
    top: `${rect.bottom + 8}px`,
    width: `${width}px`,
  }
}

function toggleLegend() {
  legendOpen.value = !legendOpen.value
  if (legendOpen.value) {
    nextTick(updateLegendPopoverPosition)
  }
}

function closeLegend() {
  legendOpen.value = false
}

function handleLegendPointerDown(event: PointerEvent) {
  const target = event.target
  if (
    target instanceof Node
    && !legendRef.value?.contains(target)
    && !legendPopoverRef.value?.contains(target)
  ) {
    closeLegend()
  }
}

function handleLegendKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeLegend()
  }
}

function handleLegendViewportChange() {
  if (legendOpen.value) {
    updateLegendPopoverPosition()
  }
}

onMounted(() => {
  window.addEventListener('pointerdown', handleLegendPointerDown)
  window.addEventListener('keydown', handleLegendKeydown)
  window.addEventListener('resize', handleLegendViewportChange)
  window.addEventListener('scroll', handleLegendViewportChange, true)
})

onBeforeUnmount(() => {
  if (flashTimer) {
    clearTimeout(flashTimer)
  }

  window.removeEventListener('pointerdown', handleLegendPointerDown)
  window.removeEventListener('keydown', handleLegendKeydown)
  window.removeEventListener('resize', handleLegendViewportChange)
  window.removeEventListener('scroll', handleLegendViewportChange, true)
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
        <div class="flex w-full items-center rounded-2xl border border-white/80 bg-white/80 p-1 md:flex-1 dark:!border-white/10 dark:!bg-white/[0.04]">
          <button
            v-for="option in viewOptions"
            :key="option.value"
            type="button"
            :class="[
              'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition',
              props.mode === option.value
                ? 'bg-brand-500 text-white shadow-[0_8px_18px_rgba(243,95,16,0.26)] dark:!bg-brand-500 dark:!text-white dark:shadow-[0_8px_18px_rgba(255,116,32,0.22)]'
                : 'text-ink-600 hover:bg-white dark:!text-ink-300 dark:hover:!bg-white/[0.08] dark:hover:!text-white',
            ]"
            @click="changeMode(option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="rounded-2xl border border-brand-100/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,248,243,0.9))] px-3 py-2.5 shadow-[0_10px_24px_rgba(243,95,16,0.08)] md:min-w-[255px] dark:!border-white/10 dark:!bg-[linear-gradient(135deg,rgba(42,34,28,0.78),rgba(29,25,22,0.72))] dark:!shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-700 dark:!bg-[rgba(255,116,32,0.14)]">
              <UiIcon name="prices" class="h-4 w-4" />
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">{{ t('calendar.activePrice') }}</p>

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
                {{ props.selectedPriceError ? t('calendar.priceLoadError') : t('common.unavailable') }}
              </p>
            </div>

            <div class="shrink-0 text-right">
              <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">{{ t('common.selected') }}</p>
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
                'rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.75)] dark:shadow-[0_0_0_1px_rgba(18,14,11,0.95),0_0_8px_rgba(255,255,255,0.10)]',
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

      <div class="border-t border-white/70 pt-3 dark:!border-white/10">
        <div ref="legendRef" class="relative flex justify-end">
          <button
            ref="legendButtonRef"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/85 px-2.5 py-1.5 text-[11px] font-semibold text-ink-600 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:border-brand-200 hover:text-brand-700 dark:!border-white/10 dark:!bg-white/[0.05] dark:!text-ink-300 dark:hover:!border-brand-400/30 dark:hover:!text-brand-200"
            :aria-expanded="legendOpen"
            aria-label="Tampilkan keterangan marker kalender"
            @click.stop="toggleLegend"
          >
            <span class="grid h-4 w-4 grid-cols-2 gap-0.5">
              <span
                v-for="item in markerLegend"
                :key="item.label"
                :class="['h-1.5 w-1.5 rounded-full', item.className]"
              />
            </span>
            <span class="hidden sm:inline">Keterangan</span>
            <UiIcon name="chevronDown" class="h-3 w-3 transition-transform" :class="legendOpen ? 'rotate-180' : ''" />
          </button>

          <Teleport to="body">
            <div
              v-if="legendOpen"
              ref="legendPopoverRef"
              class="fixed z-[9999] rounded-2xl border border-white/80 bg-white/95 p-2.5 text-xs text-ink-700 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:!border-white/10 dark:!bg-[#201b18]/95 dark:!text-ink-200 dark:!shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
              :style="legendPopoverStyle"
            >
              <p class="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                Marker kalender
              </p>
              <div class="space-y-1">
                <div
                  v-for="item in markerLegend"
                  :key="item.label"
                  class="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-brand-50/70 dark:hover:!bg-white/[0.06]"
                >
                  <span
                    :class="[
                      'h-2 w-2 shrink-0 rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.75)] dark:shadow-[0_0_0_1px_rgba(18,14,11,0.95),0_0_8px_rgba(255,255,255,0.10)]',
                      item.className,
                    ]"
                  />
                  <span class="font-medium">{{ item.label }}</span>
                </div>
              </div>
            </div>
          </Teleport>
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
