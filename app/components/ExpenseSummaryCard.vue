<script setup lang="ts">
import dayjs from 'dayjs'
import { formatRupiah } from '../utils/formatters'

interface SummaryCategory {
  categoryId: string | null
  categoryName: string
  totalAmount: string
  count: number
}

interface SummaryData {
  startDate: string
  endDate: string
  totalAmount: string
  totalCount: number
  categories: SummaryCategory[]
}

interface FilterOption {
  label: string
  value: string
}

const props = withDefaults(defineProps<{
  apiPath: string
  title: string
  /** Filter param name sent to API, e.g. 'coopId' or 'ownerId' */
  filterParam?: string
  /** Options for the admin filter dropdown */
  filterOptions?: FilterOption[]
  /** Placeholder for the filter dropdown */
  filterPlaceholder?: string
}>(), {
  filterParam: '',
  filterOptions: () => [],
  filterPlaceholder: '',
})

const api = useApi()
const auth = useAuthStore()
const { t } = useI18n()

const isAdmin = computed(() => auth.role === 'ADMIN')

const loading = ref(true)
const summary = ref<SummaryData | null>(null)
const startDate = ref('')
const endDate = ref('')
const useCustomRange = ref(false)
const selectedFilter = ref('')

const selectedMonth = ref(dayjs().month() + 1)
const selectedYear = ref(dayjs().year())

async function loadSummary() {
  loading.value = true
  try {
    const params: Record<string, string | number | boolean> = {}
    if (useCustomRange.value && startDate.value && endDate.value) {
      params.startDate = startDate.value
      params.endDate = endDate.value
    } else {
      params.month = selectedMonth.value
      params.year = selectedYear.value
    }
    if (isAdmin.value && selectedFilter.value && props.filterParam) {
      params[props.filterParam] = selectedFilter.value
    }
    summary.value = await api.get<SummaryData>(props.apiPath, params)
  } catch {
    summary.value = null
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  useCustomRange.value = !useCustomRange.value
  if (!useCustomRange.value) {
    loadSummary()
  }
}

watch([selectedMonth, selectedYear], () => {
  if (!useCustomRange.value) loadSummary()
})

watch([startDate, endDate], () => {
  if (useCustomRange.value && startDate.value && endDate.value) loadSummary()
})

watch(selectedFilter, () => {
  loadSummary()
})

onMounted(loadSummary)
</script>

<template>
  <GlassCard class="p-4 sm:p-5">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <UiIcon name="reports" class="h-4 w-4 text-brand-600" />
        <p class="text-sm font-semibold text-ink-900">{{ title }}</p>
      </div>
      <button
        type="button"
        class="rounded-lg px-2 py-1 text-[11px] font-medium text-brand-600 transition hover:bg-brand-50"
        @click="toggleMode"
      >
        {{ useCustomRange ? t('expenseSummary.switchMonth') : t('expenseSummary.switchRange') }}
      </button>
    </div>

    <!-- Filters -->
    <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2" :class="isAdmin && filterOptions.length ? 'sm:grid-cols-3' : 'sm:grid-cols-2'">
      <!-- Admin scope filter (first on desktop) -->
      <select
        v-if="isAdmin && filterOptions.length"
        v-model="selectedFilter"
        class="field-shell !rounded-xl !px-3 !py-2 text-sm"
      >
        <option value="">{{ filterPlaceholder || t('common.all') }}</option>
        <option v-for="opt in filterOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>

      <!-- Period selector -->
      <template v-if="!useCustomRange">
        <div class="sm:col-span-1" :class="isAdmin && filterOptions.length ? '' : 'sm:col-span-2'">
          <UiMonthYearPicker
            :month="selectedMonth"
            :year="selectedYear"
            @update:month="selectedMonth = $event"
            @update:year="selectedYear = $event"
          />
        </div>
      </template>
      <template v-else>
        <UiDatePicker v-model="startDate" :placeholder="t('date.pickStart')" />
        <UiDatePicker v-model="endDate" :placeholder="t('date.pickEnd')" />
      </template>
    </div>

    <div class="my-3 h-px bg-ink-100/80" />

    <!-- Loading -->
    <div v-if="loading" class="space-y-2.5">
      <div v-for="i in 3" :key="i" class="flex items-center justify-between">
        <div class="h-3.5 w-24 animate-pulse rounded bg-ink-100" />
        <div class="h-3.5 w-16 animate-pulse rounded bg-ink-100" />
      </div>
    </div>

    <!-- Summary Content -->
    <div v-else-if="summary">
      <div v-if="summary.categories.length" class="space-y-2">
        <div
          v-for="cat in summary.categories"
          :key="cat.categoryId ?? 'uncategorized'"
          class="flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-1.5 min-w-0">
            <div class="h-2 w-2 shrink-0 rounded-full bg-brand-400/60" />
            <span class="truncate text-[13px] text-ink-700">{{ cat.categoryName }}</span>
            <span class="shrink-0 text-[10px] text-ink-400">({{ cat.count }})</span>
          </div>
          <span class="shrink-0 text-[13px] font-medium tabular-nums text-ink-800">{{ formatRupiah(cat.totalAmount) }}</span>
        </div>
      </div>
      <p v-else class="py-3 text-center text-sm text-ink-400">{{ t('expenseSummary.empty') }}</p>

      <!-- Total -->
      <div class="mt-3 flex items-center justify-between rounded-xl bg-ink-50/60 px-3 py-2.5">
        <div class="flex items-baseline gap-1.5">
          <span class="text-sm font-semibold text-ink-900">Total</span>
          <span class="text-[10px] text-ink-400">{{ summary.totalCount }} {{ t('expenseSummary.entries') }}</span>
        </div>
        <span class="text-sm font-bold tabular-nums text-ink-900">{{ formatRupiah(summary.totalAmount) }}</span>
      </div>
    </div>

    <p v-else class="py-3 text-center text-sm text-ink-400">{{ t('expenseSummary.loadError') }}</p>
  </GlassCard>
</template>
