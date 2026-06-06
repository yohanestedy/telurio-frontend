<script setup lang="ts">
import type { CoopPopulationHistoryResponse } from '../../types/domain'

const props = withDefaults(defineProps<{
  open: boolean
  loading?: boolean
  error?: string
  history?: CoopPopulationHistoryResponse | null
}>(), {
  loading: false,
  error: '',
  history: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  retry: []
}>()

const { t, locale } = useI18n()

const trend = computed(() => {
  const delta = props.history?.totalDelta ?? 0
  if (delta > 0) return { tone: 'success' as const, label: t('coopProfile.trendUp'), icon: 'arrowUp' as const }
  if (delta < 0) return { tone: 'danger' as const, label: t('coopProfile.trendDown'), icon: 'arrowDown' as const }
  return { tone: 'neutral' as const, label: t('coopProfile.trendFlat'), icon: 'minus' as const }
})

function populationLabel(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return `${value.toLocaleString(locale.value === 'id' ? 'id-ID' : 'en-US')} ${t('coopProfile.populationUnit')}`
}

function signedPopulationLabel(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  if (value === 0) return `0 ${t('coopProfile.populationUnit')}`
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toLocaleString(locale.value === 'id' ? 'id-ID' : 'en-US')} ${t('coopProfile.populationUnit')}`
}

function deltaTone(value: number) {
  if (value > 0) return 'text-emerald-700'
  if (value < 0) return 'text-red-600'
  return 'text-ink-600'
}
</script>

<template>
  <UiDialog
    :open="props.open"
    :title="props.history?.coopName ?? t('coopProfile.populationHistory')"
    :description="t('coopProfile.populationHistoryDescription')"
    size="xl"
    @update:open="emit('update:open', $event as boolean)"
  >
    <LoadingSkeleton v-if="props.loading" :lines="8" />

    <div v-else-if="props.error" class="rounded-2xl border border-red-100 bg-red-50/70 p-4 text-sm text-red-700">
      <div class="flex items-start gap-2">
        <UiIcon name="alert" class="mt-0.5 h-4 w-4 shrink-0" />
        <div class="min-w-0 flex-1">
          <p class="font-semibold">{{ t('coopProfile.historyLoadFailed') }}</p>
          <p class="mt-1 text-red-600">{{ props.error }}</p>
          <UiButton size="sm" variant="ghost" icon="refresh" class="mt-3" @click="emit('retry')">
            {{ t('common.refresh') }}
          </UiButton>
        </div>
      </div>
    </div>

    <div v-else-if="props.history" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-ink-500">{{ t('coopProfile.currentPopulation') }}</p>
          <p class="mt-1 text-2xl font-bold text-ink-900">{{ populationLabel(props.history.currentPopulation) }}</p>
        </div>
        <UiBadge :tone="trend.tone" class="gap-1.5">
          <UiIcon :name="trend.icon" class="h-[0.8125rem] w-[0.8125rem]" />
          {{ trend.label }} · {{ signedPopulationLabel(props.history.totalDelta) }}
        </UiBadge>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-2xl border border-slate-200/80 bg-white/70 p-3">
          <p class="text-[0.6875rem] font-medium uppercase tracking-wide text-ink-500">{{ t('coopProfile.initialPopulation') }}</p>
          <p class="mt-1 text-lg font-bold text-ink-900">{{ populationLabel(props.history.initialPopulation) }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200/80 bg-white/70 p-3">
          <p class="text-[0.6875rem] font-medium uppercase tracking-wide text-ink-500">{{ t('coopProfile.currentPopulation') }}</p>
          <p class="mt-1 text-lg font-bold text-ink-900">{{ populationLabel(props.history.currentPopulation) }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200/80 bg-white/70 p-3">
          <p class="text-[0.6875rem] font-medium uppercase tracking-wide text-ink-500">{{ t('coopProfile.totalDelta') }}</p>
          <p class="mt-1 text-lg font-bold" :class="deltaTone(props.history.totalDelta)">{{ signedPopulationLabel(props.history.totalDelta) }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200/80 bg-white/70 p-3">
          <p class="text-[0.6875rem] font-medium uppercase tracking-wide text-ink-500">{{ t('coopProfile.latestChange') }}</p>
          <p class="mt-1 text-lg font-bold" :class="deltaTone(props.history.latestChange)">{{ signedPopulationLabel(props.history.latestChange) }}</p>
        </div>
      </div>

      <div v-if="props.history.items.length" class="overflow-hidden rounded-2xl border border-slate-200/80">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th class="px-4 py-3">{{ t('coopProfile.effectiveDate') }}</th>
                <th class="px-4 py-3">{{ t('coopProfile.populationChange') }}</th>
                <th class="px-4 py-3">Delta</th>
                <th class="px-4 py-3">{{ t('coopProfile.changeType') }}</th>
                <th class="px-4 py-3">{{ t('coopProfile.reason') }}</th>
                <th class="px-4 py-3">{{ t('coopProfile.inputDate') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in props.history.items" :key="item.id" class="border-t border-slate-200/70">
                <td class="px-4 py-3 font-medium text-ink-900">{{ formatDate(item.effectiveDate) }}</td>
                <td class="px-4 py-3 text-ink-700">
                  {{ populationLabel(item.previousPopulation) }} → {{ populationLabel(item.newPopulation) }}
                </td>
                <td class="px-4 py-3 font-semibold" :class="deltaTone(item.deltaPopulation)">
                  {{ signedPopulationLabel(item.deltaPopulation) }}
                </td>
                <td class="px-4 py-3">
                  <UiBadge tone="neutral">{{ t(`coopProfile.changeType.${item.changeType}`) }}</UiBadge>
                </td>
                <td class="max-w-[14rem] px-4 py-3 text-ink-600">{{ item.reason || '-' }}</td>
                <td class="px-4 py-3 text-ink-600">{{ formatDate(item.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-else class="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm text-ink-500">
        {{ t('coopProfile.emptyHistory') }}
      </p>
    </div>
  </UiDialog>
</template>
