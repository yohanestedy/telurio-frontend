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
  placeholder: 'Pilih tanggal',
  error: '',
  help: '',
  disabled: false,
  min: undefined,
  max: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const formatter = new DateFormatter('id-ID', { dateStyle: 'long' })
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
    return props.placeholder
  }

  return formatter.format(value.value.toDate(getLocalTimeZone()))
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
</script>

<template>
  <label class="block space-y-2">
    <span v-if="label" class="text-sm font-medium text-ink-700">{{ label }}</span>

    <DatePickerRoot
      v-model="value"
      locale="id-ID"
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
        class="z-[80] w-[min(94vw,20rem)] rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-[0_20px_45px_rgba(15,23,42,0.14)] backdrop-blur-md"
      >
        <DatePickerCalendar
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

            <DatePickerHeading class="text-sm font-semibold text-ink-900" />

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
              Besok
            </button>
            <button
              type="button"
              class="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              :disabled="!canSelectToday"
              @click="selectToday"
            >
              Hari ini
            </button>
          </div>
        </DatePickerCalendar>
      </DatePickerContent>
    </DatePickerRoot>

    <span v-if="error" class="text-xs font-medium text-rose-600">{{ error }}</span>
    <span v-else-if="help" class="text-xs text-ink-500">{{ help }}</span>
  </label>
</template>
