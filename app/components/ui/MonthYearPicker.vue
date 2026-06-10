<script setup lang="ts">
import dayjs from 'dayjs'
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'

const props = withDefaults(defineProps<{
  month: number
  year: number
  label?: string
  placeholder?: string
}>(), {
  label: '',
  placeholder: '',
})

const emit = defineEmits<{
  'update:month': [value: number]
  'update:year': [value: number]
}>()

const ui = useUiStore()
const { t } = useI18n()

const open = ref(false)
const view = ref<'month' | 'year'>('month')

const currentYear = dayjs().year()

// Short month names based on language
const monthLabels = computed(() => {
  if (ui.language === 'id') {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  }
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
})

// Full month names for display
const monthFullLabels = computed(() => {
  if (ui.language === 'id') {
    return ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  }
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
})

// Year range: current year - 4 to current year + 1
const yearStart = ref(currentYear - 4)
const years = computed(() =>
  Array.from({ length: 12 }, (_, i) => yearStart.value + i),
)

const displayValue = computed(() => {
  return `${monthFullLabels.value[props.month - 1]} ${props.year}`
})

function selectMonth(m: number) {
  emit('update:month', m)
  open.value = false
}

function selectYear(y: number) {
  emit('update:year', y)
  view.value = 'month'
}

function prevYears() {
  yearStart.value -= 12
}

function nextYears() {
  yearStart.value += 12
}

watch(open, (val) => {
  if (val) {
    view.value = 'month'
    // Center year range around selected year
    yearStart.value = props.year - 4
  }
})
</script>

<template>
  <label class="block space-y-2">
    <span v-if="label" class="text-sm font-medium text-ink-700">{{ label }}</span>

    <PopoverRoot v-model:open="open">
      <PopoverTrigger as-child>
        <button
          type="button"
          class="field-shell flex items-center justify-between gap-3 !rounded-xl !px-3 !py-2 text-left"
        >
          <span class="truncate text-sm text-ink-900">{{ displayValue }}</span>
          <span class="flex items-center gap-1">
            <button
              type="button"
              class="flex h-5 w-5 items-center justify-center rounded-full text-ink-400 transition hover:bg-slate-200 hover:text-ink-700"
              @click.stop="emit('update:month', dayjs().month() + 1); emit('update:year', dayjs().year())"
              :aria-label="'Reset ke bulan saat ini'"
            >
              <UiIcon name="close" class="h-3.5 w-3.5" />
            </button>
            <UiIcon name="calendar" class="h-4 w-4 shrink-0 text-ink-500" />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverContent
          align="start"
          :side-offset="8"
          class="z-[80] w-[min(94vw,17rem)] rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-[0_20px_45px_rgba(15,23,42,0.14)] backdrop-blur-md"
        >
          <!-- Month View -->
          <div v-if="view === 'month'">
            <div class="mb-3 flex items-center justify-between">
              <button
                type="button"
                class="rounded-lg px-2 py-1 text-sm font-semibold text-ink-900 transition hover:bg-ink-100"
                @click="view = 'year'"
              >
                {{ year }}
              </button>
            </div>

            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="(label, idx) in monthLabels"
                :key="idx"
                type="button"
                class="rounded-xl px-1 py-2 text-center text-[13px] font-medium transition"
                :class="[
                  idx + 1 === month && year === props.year
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-ink-700 hover:bg-ink-100',
                ]"
                @click="selectMonth(idx + 1)"
              >
                {{ label }}
              </button>
            </div>
          </div>

          <!-- Year View -->
          <div v-else>
            <div class="mb-3 flex items-center justify-between">
              <button
                type="button"
                class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-ink-700 transition hover:bg-slate-100"
                @click="prevYears"
              >
                <UiIcon name="chevronLeft" class="h-3.5 w-3.5" />
              </button>
              <span class="text-xs font-medium text-ink-500">
                {{ years[0] }} — {{ years[years.length - 1] }}
              </span>
              <button
                type="button"
                class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-ink-700 transition hover:bg-slate-100"
                @click="nextYears"
              >
                <UiIcon name="chevronRight" class="h-3.5 w-3.5" />
              </button>
            </div>

            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="y in years"
                :key="y"
                type="button"
                class="rounded-xl px-1 py-2 text-center text-[13px] font-medium transition"
                :class="[
                  y === year
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-ink-700 hover:bg-ink-100',
                ]"
                @click="selectYear(y)"
              >
                {{ y }}
              </button>
            </div>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </label>
</template>
