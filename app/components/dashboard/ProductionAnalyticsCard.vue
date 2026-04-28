<script setup lang="ts">
import type {
  CoopItem,
  ProductionAnalyticsPeriod,
  ProductionAnalyticsResponse,
} from '../../types/domain'

const props = defineProps<{
  analytics: ProductionAnalyticsResponse | null
  loading?: boolean
  period: ProductionAnalyticsPeriod
  coopId: string
  coops: CoopItem[]
}>()

const emit = defineEmits<{
  'update:period': [value: ProductionAnalyticsPeriod]
  'update:coopId': [value: string]
}>()

const periodOptions: Array<{ label: string; value: ProductionAnalyticsPeriod }> = [
  { label: '1 Minggu', value: '1w' },
  { label: '1 Bulan', value: '1m' },
  { label: '3 Bulan', value: '3m' },
  { label: '6 Bulan', value: '6m' },
]

const coopOptions = computed(() => [
  { label: 'Semua kandang', value: '' },
  ...props.coops.map((coop) => ({ label: coop.name, value: coop.id })),
])

const series = computed(() => props.analytics?.series ?? [])
const activeTooltipDate = ref<string | null>(null)
const tooltipPinned = ref(false)
const hasData = computed(() => series.value.some((item) => item.hasProduction))
const hasPerformance = computed(() => series.value.some((item) => item.performancePercent !== null))

const chart = computed(() => {
  const items = series.value
  const width = 720
  const height = 248
  const left = 48
  const right = 48
  const top = 16
  const bottom = 36
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const maxGoodCount = Math.max(
    ...items.filter((item) => item.hasProduction).map((item) => item.goodCount),
    1,
  )
  const goodScaleMax = Math.ceil((maxGoodCount * 1.08) / 100) * 100 || 100

  const x = (index: number) =>
    left + (items.length <= 1 ? plotWidth / 2 : (plotWidth / (items.length - 1)) * index)
  const yGood = (value: number) => top + plotHeight - (value / goodScaleMax) * plotHeight
  const yPerformance = (value: number) => top + plotHeight - (value / 100) * plotHeight

  const productionPoints = items.map((item, index) => ({
    ...item,
    x: x(index),
    y: yGood(item.goodCount),
  }))

  const performancePoints = items
    .map((item, index) => ({
      ...item,
      x: x(index),
      y: item.hasProduction && item.performancePercent !== null ? yPerformance(item.performancePercent) : null,
    }))
    .filter((item) => item.y !== null)
    .map((item) => ({ ...item, y: item.y ?? 0 }))

  const sampledIndexes = new Set<number>()
  const labelCount = items.length <= 7 ? items.length : 6
  for (let index = 0; index < labelCount; index += 1) {
    sampledIndexes.add(Math.round((index / Math.max(labelCount - 1, 1)) * Math.max(items.length - 1, 0)))
  }

  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    plotWidth,
    plotHeight,
    goodScaleMax,
    yTicks: [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      value: Math.round(goodScaleMax * ratio),
      y: top + plotHeight - plotHeight * ratio,
    })),
    performanceTicks: [0, 25, 50, 75, 100].map((value) => ({
      value,
      y: yPerformance(value),
    })),
    productionPoints,
    performancePoints,
    productionPath: buildLinePath(productionPoints, (point) => point.hasProduction),
    performancePath: buildLinePath(
      productionPoints.map((point) => ({
        ...point,
        y: point.performancePercent === null ? null : yPerformance(point.performancePercent),
      })),
      (point) => point.hasProduction && point.y !== null,
    ),
    xLabels: items
      .map((item, index) => ({ ...item, x: x(index), show: sampledIndexes.has(index) }))
      .filter((item) => item.show),
  }
})

const activeTooltipPoint = computed(() => {
  if (!activeTooltipDate.value) {
    return null
  }

  return chart.value.productionPoints.find((point) => point.date === activeTooltipDate.value) ?? null
})

const activeTooltipStyle = computed(() => {
  const point = activeTooltipPoint.value
  if (!point) {
    return {}
  }

  const below =
    point.x < 150
      ? 'translateY(14px)'
      : point.x > chart.value.width - 150
        ? 'translate(-100%, 14px)'
        : 'translate(-50%, 14px)'

  return {
    left: `${(point.x / chart.value.width) * 100}%`,
    top: `${(point.y / chart.value.height) * 100}%`,
    transform: below,
  }
})

watch([() => props.period, () => props.coopId], () => {
  activeTooltipDate.value = null
  tooltipPinned.value = false
})

const summaryCards = computed(() => {
  const summary = props.analytics?.summary
  const changes = props.analytics?.changes

  return [
    {
      label: 'Total Produksi',
      value: summary ? formatCount(summary.totalGoodCount) : '-',
      suffix: 'butir',
      change: changes?.totalGoodCountPercent ?? null,
    },
    {
      label: 'Rata-rata Harian',
      value: summary ? formatCount(summary.averageDailyGoodCount) : '-',
      suffix: 'butir',
      change: changes?.averageDailyGoodCountPercent ?? null,
    },
    {
      label: 'Rata-rata Performa',
      value: summary?.averagePerformancePercent !== null && summary?.averagePerformancePercent !== undefined
        ? `${summary.averagePerformancePercent}%`
        : '-',
      suffix: '',
      change: changes?.averagePerformancePercent ?? null,
    },
    {
      label: 'Populasi Aktif Rata-rata',
      value: summary?.averagePopulation ? formatCount(summary.averagePopulation) : '-',
      suffix: 'ekor',
      change: null,
    },
  ]
})

function updatePeriod(value: ProductionAnalyticsPeriod) {
  emit('update:period', value)
}

function updateCoop(value: string) {
  emit('update:coopId', value)
}

function formatCount(value: number) {
  return value.toLocaleString('id-ID')
}

function buildLinePath<T extends { x: number; y: number | null }>(
  points: T[],
  isDrawable: (point: T) => boolean,
) {
  let path = ''
  let drawing = false

  for (const point of points) {
    if (!isDrawable(point) || point.y === null) {
      drawing = false
      continue
    }

    path += `${drawing ? ' L' : path ? ' M' : 'M'} ${point.x} ${point.y}`
    drawing = true
  }

  return path
}

function showTooltip(date: string, pinned = false) {
  activeTooltipDate.value = date
  tooltipPinned.value = pinned
}

function hideHoverTooltip() {
  if (!tooltipPinned.value) {
    activeTooltipDate.value = null
  }
}

function toggleTooltip(date: string) {
  if (activeTooltipDate.value === date && tooltipPinned.value) {
    activeTooltipDate.value = null
    tooltipPinned.value = false
    return
  }

  showTooltip(date, true)
}

function closeTooltip() {
  activeTooltipDate.value = null
  tooltipPinned.value = false
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function formatPerformance(value: number | null) {
  return value === null ? '-' : `${value}%`
}

function formatPercentChange(value: number | null) {
  if (value === null) {
    return 'Belum ada pembanding'
  }

  return `${value > 0 ? '+' : ''}${value}% vs periode sebelumnya`
}

function changeTone(value: number | null) {
  if (value === null) {
    return 'text-ink-400'
  }

  if (value >= 0) {
    return 'text-emerald-700'
  }

  return 'text-rose-600'
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in periodOptions"
          :key="option.value"
          type="button"
          class="rounded-xl border px-3 py-2 text-xs font-semibold transition"
          :class="option.value === period
            ? 'border-brand-200 bg-brand-50 text-brand-700'
            : 'border-slate-200 bg-white/65 text-ink-600 hover:bg-white'"
          @click="updatePeriod(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <UiSelect
        :model-value="coopId"
        :options="coopOptions"
        :searchable="false"
        class="min-w-0 lg:w-64"
        placeholder="Semua kandang"
        @update:model-value="updateCoop"
      />
    </div>

    <LoadingSkeleton v-if="loading" :lines="8" />

    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in summaryCards"
          :key="item.label"
          class="rounded-2xl border border-slate-200/80 bg-white/62 p-3"
        >
          <p class="text-xs font-medium text-ink-500">{{ item.label }}</p>
          <p class="mt-1 flex items-baseline gap-1 text-xl font-semibold text-ink-900">
            {{ item.value }}
            <span v-if="item.suffix" class="text-xs font-medium text-ink-500">{{ item.suffix }}</span>
          </p>
          <p class="mt-2 text-xs" :class="changeTone(item.change)">
            {{ formatPercentChange(item.change) }}
          </p>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3">
          <div class="flex flex-wrap items-center gap-4 text-sm text-ink-700">
            <span class="inline-flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              Produksi (butir)
            </span>
            <span class="inline-flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full bg-brand-500" />
              Performa (%)
            </span>
          </div>
          <p v-if="analytics" class="text-xs text-ink-500">
            {{ formatDate(analytics.startDate) }} - {{ formatDate(analytics.endDate) }}
          </p>
        </div>

        <div v-if="!hasData" class="px-4 py-12 text-center text-sm text-ink-500">
          Belum ada data produksi untuk periode ini.
        </div>

        <div v-else class="w-full overflow-x-auto px-2 py-4">
          <div class="relative min-w-[460px] sm:min-w-[620px] lg:min-w-[680px]">
            <svg
              class="w-full"
              :viewBox="`0 0 ${chart.width} ${chart.height}`"
              role="img"
              aria-label="Grafik produksi telur dan performa produksi"
              @click="closeTooltip"
            >
              <g>
                <line
                  v-for="tick in chart.yTicks"
                  :key="`grid-${tick.value}`"
                  :x1="chart.left"
                  :x2="chart.width - chart.right"
                  :y1="tick.y"
                  :y2="tick.y"
                  stroke="#E2E8F0"
                  stroke-dasharray="4 6"
                />
                <text
                  v-for="tick in chart.yTicks"
                  :key="`left-${tick.value}`"
                  :x="chart.left - 10"
                  :y="tick.y + 4"
                  text-anchor="end"
                  class="fill-slate-500 text-[10px]"
                >
                  {{ formatCount(tick.value) }}
                </text>
                <text
                  v-for="tick in chart.performanceTicks"
                  :key="`right-${tick.value}`"
                  :x="chart.width - chart.right + 10"
                  :y="tick.y + 4"
                  class="fill-brand-600 text-[10px]"
                >
                  {{ tick.value }}%
                </text>
              </g>

              <path
                v-if="chart.productionPath"
                :d="chart.productionPath"
                fill="none"
                stroke="#059669"
                stroke-width="2.3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                v-if="chart.performancePath"
                :d="chart.performancePath"
                fill="none"
                stroke="#F97316"
                stroke-width="1.9"
                stroke-dasharray="6 7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <g
                v-for="point in chart.productionPoints"
                :key="`production-${point.date}`"
                :class="{ 'cursor-pointer': point.hasProduction }"
                role="button"
                tabindex="0"
                @mouseenter="point.hasProduction && showTooltip(point.date)"
                @mouseleave="hideHoverTooltip"
                @focus="point.hasProduction && showTooltip(point.date)"
                @blur="hideHoverTooltip"
                @click.stop="point.hasProduction && toggleTooltip(point.date)"
                @keydown.enter.prevent="point.hasProduction && toggleTooltip(point.date)"
                @keydown.space.prevent="point.hasProduction && toggleTooltip(point.date)"
              >
                <circle
                  v-if="point.hasProduction"
                  :cx="point.x"
                  :cy="point.y"
                  r="9"
                  fill="transparent"
                />
                <circle
                  v-if="point.hasProduction"
                  :cx="point.x"
                  :cy="point.y"
                  r="3.8"
                  fill="#059669"
                  stroke="white"
                  stroke-width="1.8"
                />
                <circle
                  v-if="point.date === activeTooltipDate"
                  :cx="point.x"
                  :cy="point.y"
                  r="7.2"
                  fill="none"
                  stroke="#A7F3D0"
                  stroke-width="3"
                />
              </g>
              <g
                v-for="point in chart.performancePoints"
                :key="`performance-${point.date}`"
                class="cursor-pointer"
                role="button"
                tabindex="0"
                @mouseenter="showTooltip(point.date)"
                @mouseleave="hideHoverTooltip"
                @focus="showTooltip(point.date)"
                @blur="hideHoverTooltip"
                @click.stop="toggleTooltip(point.date)"
                @keydown.enter.prevent="toggleTooltip(point.date)"
                @keydown.space.prevent="toggleTooltip(point.date)"
              >
                <circle :cx="point.x" :cy="point.y" r="8" fill="transparent" />
                <circle :cx="point.x" :cy="point.y" r="3" fill="#F97316" stroke="white" stroke-width="1.6" />
              </g>

              <text
                v-for="label in chart.xLabels"
                :key="`label-${label.date}`"
                :x="label.x"
                :y="chart.height - 11"
                text-anchor="middle"
                class="fill-slate-600 text-[10px]"
              >
                {{ formatDate(label.date).replace(/\s\d{4}$/, '') }}
              </text>
            </svg>

            <div
              v-if="activeTooltipPoint"
              class="pointer-events-none absolute z-10 w-64 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm shadow-[0_18px_38px_rgba(15,23,42,0.16)]"
              :style="activeTooltipStyle"
            >
              <p class="font-semibold text-ink-900">{{ formatFullDate(activeTooltipPoint.date) }}</p>
              <div class="mt-3 space-y-2 text-ink-600">
                <div class="flex items-center justify-between gap-3">
                  <span class="inline-flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-emerald-600" />
                    Produksi
                  </span>
                  <span class="font-semibold text-ink-900">{{ formatCount(activeTooltipPoint.goodCount) }} butir</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="inline-flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-brand-500" />
                    Performa
                  </span>
                  <span class="font-semibold text-ink-900">{{ formatPerformance(activeTooltipPoint.performancePercent) }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="inline-flex items-center gap-2">
                    <UiIcon name="users" class="h-3.5 w-3.5 text-blue-600" />
                    Populasi Aktif
                  </span>
                  <span class="font-semibold text-ink-900">
                    {{ activeTooltipPoint.averagePopulation ? formatCount(activeTooltipPoint.averagePopulation) : '-' }} ekor
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2 border-t border-slate-200/70 px-4 py-3 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Performa = jumlah butir / populasi aktif saat produksi dicatat.</p>
          <p v-if="!hasPerformance">Performa akan tampil untuk produksi baru setelah snapshot populasi tersedia.</p>
        </div>
      </div>
    </template>
  </div>
</template>
