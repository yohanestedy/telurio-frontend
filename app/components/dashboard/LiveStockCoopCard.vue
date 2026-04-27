<script setup lang="ts">
import type { LiveStockCoopItem } from '../../types/domain'
import type { AppIconName } from '../../utils/icons'

interface CoopFlowSummary {
  productionInKg: number
  allocationReleaseInKg: number
  adjustmentInKg: number
  allocationOutKg: number
  adjustmentOutKg: number
  totalInKg: number
  totalOutKg: number
  netFlowKg: number
}

const props = defineProps<{
  item: LiveStockCoopItem
  summary: CoopFlowSummary
}>()

const emit = defineEmits<{
  'show-detail': []
}>()

function formatSignedKg(value: number) {
  const normalized = Number(value.toFixed(3))
  if (normalized === 0) {
    return '0'
  }

  const prefix = normalized > 0 ? '+' : '-'
  return `${prefix}${formatKg(Math.abs(normalized))}`
}

function netFlowToneClass(value: number) {
  if (value > 0) {
    return 'text-emerald-700'
  }

  if (value < 0) {
    return 'text-rose-700'
  }

  return 'text-ink-700'
}

function netFlowIcon(value: number): AppIconName {
  if (value > 0) {
    return 'arrowUp'
  }

  if (value < 0) {
    return 'arrowDown'
  }

  return 'minus'
}

const isActive = computed(() => Number(props.item.availableKg) > 0)

const inFlowRows = computed(() => [
  {
    label: 'Produksi',
    value: props.summary.productionInKg,
    icon: 'productions' as const,
  },
  {
    label: 'Rilis alokasi',
    value: props.summary.allocationReleaseInKg,
    icon: 'layers' as const,
  },
  {
    label: 'Penyesuaian (+)',
    value: props.summary.adjustmentInKg,
    icon: 'plus' as const,
  },
])

const outFlowRows = computed(() => [
  {
    label: 'Alokasi order',
    value: props.summary.allocationOutKg,
    icon: 'orders' as const,
  },
  {
    label: 'Penyesuaian (-)',
    value: props.summary.adjustmentOutKg,
    icon: 'minus' as const,
  },
])
</script>

<template>
  <article class="rounded-2xl border border-white/70 bg-white/88 px-3 py-3 shadow-[0_8px_18px_rgba(67,63,57,0.07)] sm:px-3.5 sm:py-3.5">
    <div class="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
      <div class="flex min-w-0 items-center gap-2">
        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-100/80 bg-emerald-50 text-emerald-700">
          <UiIcon name="coops" class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <p class="truncate text-base font-semibold leading-tight text-ink-900 sm:text-lg">
              {{ props.item.coopName }}
            </p>
            <span
              :class="[
                'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                isActive
                  ? 'border-emerald-200 bg-emerald-100/80 text-emerald-700'
                  : 'border-ink-200 bg-ink-100/70 text-ink-600',
              ]"
            >
              {{ isActive ? 'Aktif' : 'Kosong' }}
            </span>
          </div>
        </div>
      </div>

      <div class="text-left md:text-right">
        <p class="text-lg font-bold tracking-tight text-ink-900 sm:text-xl">{{ formatKg(props.item.availableKg) }} kg</p>
        <p class="mt-1 inline-flex items-center gap-1 text-xs font-semibold" :class="netFlowToneClass(props.summary.netFlowKg)">
          <span class="text-ink-500">Net pergerakan</span>
          <UiIcon :name="netFlowIcon(props.summary.netFlowKg)" class="h-3.5 w-3.5" />
          <span>{{ formatSignedKg(props.summary.netFlowKg) }} kg</span>
        </p>
      </div>
    </div>

    <div class="mt-2.5 grid gap-2 xl:grid-cols-2">
      <section class="flex flex-col rounded-xl border border-emerald-200/70 bg-emerald-50/40">
        <div class="flex items-center gap-1.5 border-b border-emerald-100/80 px-2.5 py-2">
          <span class="grid h-6 w-6 place-items-center rounded-full bg-emerald-100/90 text-emerald-700">
            <UiIcon name="arrowDown" class="h-3 w-3" />
          </span>
          <p class="text-sm font-semibold text-emerald-700">Alur Masuk</p>
        </div>
        <div class="flex-1 space-y-1.5 px-2.5 py-2">
          <div
            v-for="row in inFlowRows"
            :key="row.label"
            class="flex items-center justify-between gap-2 text-xs text-ink-700 sm:text-sm"
          >
            <span class="inline-flex items-center gap-2">
              <UiIcon :name="row.icon" class="h-3.5 w-3.5 text-emerald-700" />
              {{ row.label }}
            </span>
            <span class="font-medium text-ink-900">{{ formatKg(row.value) }} kg</span>
          </div>
        </div>
        <div class="flex items-center justify-between border-t border-emerald-100/80 px-2.5 py-2 text-emerald-700">
          <span class="text-sm font-semibold">Total Masuk</span>
          <span class="text-lg font-bold">{{ formatKg(props.summary.totalInKg) }} kg</span>
        </div>
      </section>

      <section class="flex flex-col rounded-xl border border-brand-200/70 bg-brand-50/35">
        <div class="flex items-center gap-1.5 border-b border-brand-100/80 px-2.5 py-2">
          <span class="grid h-6 w-6 place-items-center rounded-full bg-brand-100/90 text-brand-700">
            <UiIcon name="delivery" class="h-3 w-3" />
          </span>
          <p class="text-sm font-semibold text-brand-700">Alur Keluar</p>
        </div>
        <div class="flex-1 space-y-1.5 px-2.5 py-2">
          <div
            v-for="row in outFlowRows"
            :key="row.label"
            class="flex items-center justify-between gap-2 text-xs text-ink-700 sm:text-sm"
          >
            <span class="inline-flex items-center gap-2">
              <UiIcon :name="row.icon" class="h-3.5 w-3.5 text-brand-700" />
              {{ row.label }}
            </span>
            <span class="font-medium text-ink-900">{{ formatKg(row.value) }} kg</span>
          </div>
        </div>
        <div class="flex items-center justify-between border-t border-brand-100/80 px-2.5 py-2 text-brand-700">
          <span class="text-sm font-semibold">Total Keluar</span>
          <span class="text-lg font-bold">{{ formatKg(props.summary.totalOutKg) }} kg</span>
        </div>
      </section>
    </div>

    <div class="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/90 pt-2">
      <p class="inline-flex items-center gap-1.5 text-xs text-ink-500">
        <UiIcon name="clock" class="h-3.5 w-3.5" />
        Update terakhir {{ props.item.updatedAt ? formatDateTime(props.item.updatedAt) : '-' }}
      </p>
      <UiButton
        variant="ghost"
        size="sm"
        trailing-icon="chevronRight"
        @click="emit('show-detail')"
      >
        Lihat Detail
      </UiButton>
    </div>
  </article>
</template>
