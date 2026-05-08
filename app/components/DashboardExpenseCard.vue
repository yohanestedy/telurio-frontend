<script setup lang="ts">
import dayjs from 'dayjs'
import type { CoopItem, UserItem } from '../types/domain'
import { formatRupiah } from '../utils/formatters'

interface ChangeInfo {
  percentage: number
  direction: 'up' | 'down' | 'flat'
}

interface CategoryItem {
  name: string
  amount: string
  count: number
}

interface ExpenseDashboardData {
  month: number
  year: number
  total: { amount: string; count: number; change: ChangeInfo }
  coop: { amount: string; count: number; change: ChangeInfo; topCategories: CategoryItem[] }
  general: { amount: string; count: number; change: ChangeInfo; topCategories: CategoryItem[] }
}

const props = defineProps<{
  coops: CoopItem[]
  owners: UserItem[]
}>()

const api = useApi()
const auth = useAuthStore()
const { t } = useI18n()

const isAdmin = computed(() => auth.role === 'ADMIN')
const loading = ref(true)
const data = ref<ExpenseDashboardData | null>(null)

const selectedMonth = ref(dayjs().month() + 1)
const selectedYear = ref(dayjs().year())
const selectedCoop = ref('')
const selectedOwner = ref('')

const coopOptions = computed(() =>
  props.coops.map((c) => ({ label: c.name, value: c.id })),
)
const ownerOptions = computed(() =>
  props.owners.map((o) => ({ label: o.name, value: o.id })),
)

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      month: selectedMonth.value,
      year: selectedYear.value,
    }
    if (isAdmin.value && selectedCoop.value) params.coopId = selectedCoop.value
    if (isAdmin.value && selectedOwner.value) params.ownerId = selectedOwner.value
    data.value = await api.get<ExpenseDashboardData>('/expenses/dashboard', params)
  } catch {
    data.value = null
  } finally {
    loading.value = false
  }
}

function changeLabel(change: ChangeInfo): string {
  if (change.direction === 'flat') return '—'
  const arrow = change.direction === 'up' ? '↑' : '↓'
  return `${arrow} ${change.percentage}%`
}

function changeColor(change: ChangeInfo): string {
  if (change.direction === 'up') return 'text-red-600'
  if (change.direction === 'down') return 'text-emerald-600'
  return 'text-ink-400'
}

watch([selectedMonth, selectedYear, selectedCoop, selectedOwner], () => {
  loadData()
})

onMounted(loadData)
</script>

<template>
  <GlassCard>
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-start gap-3">
        <div class="surface-outline rounded-2xl p-2.5 text-brand-700">
          <UiIcon name="expenses" class="h-5 w-5" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-ink-900">{{ t('dashboard.expense.title') }}</h2>
          <p class="mt-0.5 text-sm text-ink-600">{{ t('dashboard.expense.description') }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2" :class="isAdmin ? 'lg:grid-cols-3' : ''">
      <UiMonthYearPicker
        :month="selectedMonth"
        :year="selectedYear"
        @update:month="selectedMonth = $event"
        @update:year="selectedYear = $event"
      />
      <select
        v-if="isAdmin && coopOptions.length"
        v-model="selectedCoop"
        class="field-shell !rounded-xl !px-3 !py-2 text-sm"
      >
        <option value="">{{ t('stock.allCoops') }}</option>
        <option v-for="opt in coopOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <select
        v-if="isAdmin && ownerOptions.length"
        v-model="selectedOwner"
        class="field-shell !rounded-xl !px-3 !py-2 text-sm"
      >
        <option value="">{{ t('expense.allOwners') }}</option>
        <option v-for="opt in ownerOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="mt-5 grid gap-4 sm:grid-cols-3">
      <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-xl bg-ink-100/60" />
    </div>

    <!-- Content -->
    <div v-else-if="data" class="mt-5 space-y-5">
      <!-- Metric Cards -->
      <div class="grid gap-3 sm:grid-cols-3">
        <!-- Total -->
        <div class="rounded-xl bg-ink-50/60 p-4 dark:bg-ink-800/40">
          <p class="text-xs font-medium uppercase tracking-wide text-ink-500">Total</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-ink-900">{{ formatRupiah(data.total.amount) }}</p>
          <div class="mt-1 flex items-center gap-2">
            <span class="text-xs text-ink-400">{{ data.total.count }} {{ t('expenseSummary.entries') }}</span>
            <span class="text-xs font-medium" :class="changeColor(data.total.change)">
              {{ changeLabel(data.total.change) }}
            </span>
          </div>
        </div>

        <!-- Coop -->
        <div class="rounded-xl bg-orange-50/60 p-4 dark:bg-orange-950/30">
          <p class="text-xs font-medium uppercase tracking-wide text-ink-500">{{ t('menu.label.Expenses') }}</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-ink-900">{{ formatRupiah(data.coop.amount) }}</p>
          <div class="mt-1 flex items-center gap-2">
            <span class="text-xs text-ink-400">{{ data.coop.count }} {{ t('expenseSummary.entries') }}</span>
            <span class="text-xs font-medium" :class="changeColor(data.coop.change)">
              {{ changeLabel(data.coop.change) }}
            </span>
          </div>
        </div>

        <!-- Personal -->
        <div class="rounded-xl bg-indigo-50/60 p-4 dark:bg-indigo-950/30">
          <p class="text-xs font-medium uppercase tracking-wide text-ink-500">{{ t('menu.label.General Expenses') }}</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-ink-900">{{ formatRupiah(data.general.amount) }}</p>
          <div class="mt-1 flex items-center gap-2">
            <span class="text-xs text-ink-400">{{ data.general.count }} {{ t('expenseSummary.entries') }}</span>
            <span class="text-xs font-medium" :class="changeColor(data.general.change)">
              {{ changeLabel(data.general.change) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Top Categories -->
      <div class="grid gap-4 sm:grid-cols-2">
        <!-- Coop Top Categories -->
        <div class="rounded-xl border border-ink-100/60 p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
            {{ t('dashboard.expense.topCoop') }}
          </p>
          <div v-if="data.coop.topCategories.length" class="mt-3 space-y-2">
            <div
              v-for="cat in data.coop.topCategories"
              :key="cat.name"
              class="flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-1.5 min-w-0">
                <div class="h-2 w-2 shrink-0 rounded-full bg-brand-400/60" />
                <span class="truncate text-[13px] text-ink-700">{{ cat.name }}</span>
                <span class="shrink-0 text-[10px] text-ink-400">({{ cat.count }})</span>
              </div>
              <span class="shrink-0 text-[13px] font-medium tabular-nums text-ink-800">{{ formatRupiah(cat.amount) }}</span>
            </div>
          </div>
          <p v-else class="mt-3 text-sm text-ink-400">{{ t('expenseSummary.empty') }}</p>
        </div>

        <!-- General Top Categories -->
        <div class="rounded-xl border border-ink-100/60 p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
            {{ t('dashboard.expense.topPersonal') }}
          </p>
          <div v-if="data.general.topCategories.length" class="mt-3 space-y-2">
            <div
              v-for="cat in data.general.topCategories"
              :key="cat.name"
              class="flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-1.5 min-w-0">
                <div class="h-2 w-2 shrink-0 rounded-full bg-indigo-400/60" />
                <span class="truncate text-[13px] text-ink-700">{{ cat.name }}</span>
                <span class="shrink-0 text-[10px] text-ink-400">({{ cat.count }})</span>
              </div>
              <span class="shrink-0 text-[13px] font-medium tabular-nums text-ink-800">{{ formatRupiah(cat.amount) }}</span>
            </div>
          </div>
          <p v-else class="mt-3 text-sm text-ink-400">{{ t('expenseSummary.empty') }}</p>
        </div>
      </div>
    </div>

    <!-- Error -->
    <p v-else class="mt-5 text-center text-sm text-ink-400">{{ t('expenseSummary.loadError') }}</p>
  </GlassCard>
</template>
