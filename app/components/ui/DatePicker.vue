<script setup lang="ts">
import {
  type DateValue,
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
} from '@internationalized/date'
import {
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerContent,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridHead,
  DatePickerGridRow,
  DatePickerHeadCell,
  DatePickerHeader,
  DatePickerHeading,
  DatePickerNext,
  DatePickerPrev,
  DatePickerRoot,
  DatePickerTrigger,
} from 'reka-ui'
import dayjs from 'dayjs'

interface Props {
  modelValue?: string | null
  label?: string
  placeholder?: string
  error?: string
  help?: string
  disabled?: boolean
  min?: string
  max?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  error: '',
  help: '',
  disabled: false,
  min: undefined,
  max: undefined,
})
const ui = useUiStore()
const { t } = useI18n()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const locale = computed(() => ui.language === 'id' ? 'id-ID' : 'en-US')
const formatter = computed(() => new DateFormatter(locale.value, { dateStyle: 'long' }))
const value = ref<DateValue>()

function parseDateString(input?: string | null) {
  if (!input) {
    return undefined
  }

  try {
    return parseDate(input)
  }
  catch {
    return undefined
  }
}

const minValue = computed(() => parseDateString(props.min))
const maxValue = computed(() => parseDateString(props.max))

watch(
  () => props.modelValue,
  (nextValue) => {
    const parsed = parseDateString(nextValue)
    const current = value.value?.toString() ?? ''
    const next = parsed?.toString() ?? ''

    if (current !== next) {
      value.value = parsed
    }
  },
  { immediate: true },
)

watch(value, (nextValue) => {
  const next = nextValue?.toString() ?? ''
  const current = props.modelValue ?? ''

  if (next !== current) {
    emit('update:modelValue', next)
  }
})

const displayValue = computed(() => {
  if (!value.value) {
    return props.placeholder || t('date.placeholder')
  }

  return formatter.value.format(value.value.toDate(getLocalTimeZone()))
})

const todayValue = computed(() => today(getLocalTimeZone()))
const tomorrowValue = computed(() => todayValue.value.add({ days: 1 }))

function isWithinSelectableRange(target: DateValue) {
  if (props.disabled) {
    return false
  }

  if (minValue.value && target.compare(minValue.value) < 0) {
    return false
  }

  if (maxValue.value && target.compare(maxValue.value) > 0) {
    return false
  }

  return true
}

const canSelectToday = computed(() => {
  return isWithinSelectableRange(todayValue.value)
})

const canSelectTomorrow = computed(() => {
  return isWithinSelectableRange(tomorrowValue.value)
})

function selectToday() {
  if (!canSelectToday.value) {
    return
  }

  value.value = todayValue.value
}

function selectTomorrow() {
  if (!canSelectTomorrow.value) {
    return
  }

  value.value = tomorrowValue.value
}

// --- Month/Year picker within calendar ---
type PickerView = 'calendar' | 'month' | 'year'
const pickerView = ref<PickerView>('calendar')

const monthLabelsShort = computed(() => {
  if (ui.language === 'id') {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  }
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
})

const viewingYear = ref(dayjs().year())
const yearRangeStart = ref(dayjs().year() - 4)
const yearRange = computed(() => Array.from({ length: 12 }, (_, i) => yearRangeStart.value + i))

function openMonthPicker() {
  // Set viewingYear to the currently displayed calendar month
  if (value.value) {
    viewingYear.value = value.value.year
  } else {
    viewingYear.value = dayjs().year()
  }
  pickerView.value = 'month'
}

function openYearPicker() {
  yearRangeStart.value = viewingYear.value - 4
  pickerView.value = 'year'
}

function selectMonthFromPicker(monthIndex: number) {
  // Navigate the calendar to the selected month
  const targetYear = viewingYear.value
  const targetMonth = monthIndex + 1
  const day = value.value?.day ?? 1
  const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  try {
    value.value = parseDate(dateStr)
  } catch {
    // If day doesn't exist in month (e.g. Feb 31), use first day
    value.value = parseDate(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01`)
  }
  pickerView.value = 'calendar'
}

function selectYearFromPicker(year: number) {
  viewingYear.value = year
  pickerView.value = 'month'
}

function prevYearRange() {
  yearRangeStart.value -= 12
}

function nextYearRange() {
  yearRangeStart.value += 12
}
</script>

<template>
  <label class="block space-y-2">
    <span v-if="label" class="text-sm font-medium text-ink-700">{{ label }}</span>

    <DatePickerRoot
      v-model="value"
      :locale="locale"
      :disabled="disabled"
      :min-value="minValue"
      :max-value="maxValue"
      :close-on-select="true"
    >
      <DatePickerTrigger as-child>
        <button
          type="button"
          class="field-shell flex items-center justify-between gap-3 py-3 text-left"
          :class="{ 'cursor-not-allowed opacity-70': disabled }"
          :disabled="disabled"
        >
          <span :class="value ? 'text-ink-900' : 'text-ink-400'" class="truncate text-sm">
            {{ displayValue }}
          </span>
          <UiIcon name="calendar" class="h-4 w-4 shrink-0 text-ink-500" />
        </button>
      </DatePickerTrigger>

      <DatePickerContent
        align="start"
        :side-offset="10"
        data-ui-date-picker-content="true"
        class="z-[80] w-[min(94vw,20rem)] rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-[0_20px_45px_rgba(15,23,42,0.14)] backdrop-blur-md"
        @open-auto-focus="pickerView = 'calendar'"
      >
        <!-- Month Picker View -->
        <div v-if="pickerView === 'month'" class="space-y-3">
          <div class="flex items-center justify-center">
            <button
              type="button"
              class="rounded-lg px-3 py-1 text-sm font-semibold text-ink-900 transition hover:bg-ink-100"
              @click="openYearPicker"
            >
              {{ viewingYear }}
            </button>
          </div>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="(label, idx) in monthLabelsShort"
              :key="idx"
              type="button"
              class="rounded-xl px-1 py-2.5 text-center text-[13px] font-medium transition"
              :class="[
                value && idx + 1 === value.month && viewingYear === value.year
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-ink-700 hover:bg-ink-100',
              ]"
              @click="selectMonthFromPicker(idx)"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <!-- Year Picker View -->
        <div v-else-if="pickerView === 'year'" class="space-y-3">
          <div class="flex items-center justify-between">
            <button
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-ink-700 transition hover:bg-slate-100"
              @click="prevYearRange"
            >
              <UiIcon name="chevronLeft" class="h-3.5 w-3.5" />
            </button>
            <span class="text-xs font-medium text-ink-500">
              {{ yearRange[0] }} — {{ yearRange[yearRange.length - 1] }}
            </span>
            <button
              type="button"
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-ink-700 transition hover:bg-slate-100"
              @click="nextYearRange"
            >
              <UiIcon name="chevronRight" class="h-3.5 w-3.5" />
            </button>
          </div>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="y in yearRange"
              :key="y"
              type="button"
              class="rounded-xl px-1 py-2.5 text-center text-[13px] font-medium transition"
              :class="[
                y === viewingYear
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-ink-700 hover:bg-ink-100',
              ]"
              @click="selectYearFromPicker(y)"
            >
              {{ y }}
            </button>
          </div>
        </div>

        <!-- Calendar View (default) -->
        <DatePickerCalendar
          v-else
          v-slot="{ weekDays, grid }"
          :week-starts-on="1"
          class="space-y-3"
        >
          <DatePickerHeader class="flex items-center justify-between gap-2">
            <DatePickerPrev v-slot="{ disabled: prevDisabled }" as-child>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-ink-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="prevDisabled"
              >
                <UiIcon name="chevronLeft" class="h-4 w-4" />
              </button>
            </DatePickerPrev>

            <button
              type="button"
              class="rounded-lg px-2 py-1 text-sm font-semibold text-ink-900 transition hover:bg-ink-100"
              @click="openMonthPicker"
            >
              <DatePickerHeading />
            </button>

            <DatePickerNext v-slot="{ disabled: nextDisabled }" as-child>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-ink-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="nextDisabled"
              >
                <UiIcon name="chevronRight" class="h-4 w-4" />
              </button>
            </DatePickerNext>
          </DatePickerHeader>

          <div class="space-y-3">
            <DatePickerGrid
              v-for="month in grid"
              :key="month.value.toString()"
              class="w-full border-collapse"
            >
              <DatePickerGridHead>
                <DatePickerGridRow class="grid grid-cols-7 gap-1">
                  <DatePickerHeadCell
                    v-for="day in weekDays"
                    :key="day"
                    class="text-center text-[11px] font-semibold uppercase tracking-wide text-ink-500"
                  >
                    {{ day }}
                  </DatePickerHeadCell>
                </DatePickerGridRow>
              </DatePickerGridHead>

              <DatePickerGridBody class="mt-1">
                <DatePickerGridRow
                  v-for="(weekDates, weekIndex) in month.rows"
                  :key="`week-${weekIndex}`"
                  class="mt-1 grid grid-cols-7 gap-1"
                >
                  <DatePickerCell
                    v-for="dateObj in weekDates"
                    :key="dateObj.toString()"
                    :date="dateObj"
                  >
                    <DatePickerCellTrigger
                      :day="dateObj"
                      :month="month.value"
                      class="flex h-9 w-9 items-center justify-center rounded-xl text-sm text-ink-700 outline-none transition hover:bg-brand-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-35 data-[outside-view]:text-ink-300 data-[selected]:bg-brand-600 data-[selected]:font-semibold data-[selected]:text-white data-[selected]:shadow-sm data-[today]:bg-brand-100 data-[today]:font-bold data-[today]:text-brand-800 data-[today]:ring-2 data-[today]:ring-brand-300 focus-visible:ring-2 focus-visible:ring-brand-300"
                    />
                  </DatePickerCell>
                </DatePickerGridRow>
              </DatePickerGridBody>
            </DatePickerGrid>
          </div>

          <div class="flex items-center justify-end gap-2 border-t border-slate-200/80 pt-3">
            <button
              type="button"
              class="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              :disabled="!canSelectTomorrow"
              @click="selectTomorrow"
            >
              {{ t('common.tomorrow') }}
            </button>
            <button
              type="button"
              class="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              :disabled="!canSelectToday"
              @click="selectToday"
            >
              {{ t('common.today') }}
            </button>
          </div>
        </DatePickerCalendar>
      </DatePickerContent>
    </DatePickerRoot>

    <span v-if="error" class="text-xs font-medium text-rose-600">{{ error }}</span>
    <span v-else-if="help" class="text-xs text-ink-500">{{ help }}</span>
  </label>
</template>
