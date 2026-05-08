<script setup lang="ts">
import dayjs from 'dayjs'
import type { CoopItem } from '../../types/domain'

const props = defineProps<{
  coop: CoopItem
  canUpdatePopulation?: boolean
}>()

const emit = defineEmits<{
  updatePopulation: [coop: CoopItem]
}>()
const { t, locale } = useI18n()

const age = computed(() => {
  if (!props.coop.chickBirthDate) {
    return {
      main: '-',
      since: t('coopProfile.docMissing'),
      tone: 'text-ink-700',
    }
  }

  const birthDate = dayjs(props.coop.chickBirthDate).startOf('day')
  const today = dayjs().startOf('day')

  if (!birthDate.isValid()) {
    return {
      main: '-',
      since: t('coopProfile.docInvalid'),
      tone: 'text-ink-700',
    }
  }

  const totalDays = Math.max(today.diff(birthDate, 'day'), 0)
  const weeks = Math.floor(totalDays / 7)
  const days = totalDays % 7

  return {
    main: days > 0
      ? `${weeks} ${t('coopProfile.week')} ${days} ${t('coopProfile.day')}`
      : `${weeks} ${t('coopProfile.week')}`,
    since: t('coopProfile.since', { date: formatDayMonthYearId(props.coop.chickBirthDate) }),
    tone: weeks >= 1 ? 'text-brand-700' : 'text-ink-900',
  }
})

const populationLabel = computed(() =>
  `${props.coop.population.toLocaleString(locale.value === 'id' ? 'id-ID' : 'en-US')} ${t('coopProfile.populationUnit')}`,
)
</script>

<template>
  <article class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 dark:!border-white/10 dark:!bg-[rgba(28,25,22,0.62)]">
    <div class="p-3.5">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2.5">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:!bg-[rgba(16,185,129,0.12)]">
            <UiIcon name="coops" class="h-4.5 w-4.5" />
          </span>
          <div class="flex min-w-0 items-center gap-2">
            <p class="truncate text-sm font-semibold text-ink-900 sm:text-base">{{ props.coop.name }}</p>
            <UiBadge :tone="props.coop.isActive ? 'success' : 'neutral'">
              {{ props.coop.isActive ? t('common.active') : t('common.inactive') }}
            </UiBadge>
          </div>
        </div>
        <button
          v-if="props.canUpdatePopulation"
          type="button"
          class="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white/70 text-ink-500 transition hover:bg-white hover:text-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-100 dark:!border-white/10 dark:!bg-[rgba(255,255,255,0.06)] dark:hover:!bg-[rgba(255,116,32,0.12)]"
          :title="t('coopProfile.updatePopulation')"
          :aria-label="t('coopProfile.updatePopulation')"
          @click="emit('updatePopulation', props.coop)"
        >
          <UiIcon name="edit" class="h-3.5 w-3.5" />
        </button>
      </div>

      <div class="mt-3 h-px bg-slate-200/75 dark:!bg-white/10" />

      <div class="mt-3 grid grid-cols-[minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1.3fr)] gap-2">
        <div class="min-w-0 border-r border-slate-200/80 pr-2 dark:!border-white/10">
          <div class="flex items-center gap-1.5">
            <span class="hidden h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 sm:grid dark:!bg-[rgba(16,185,129,0.12)]">
              <UiIcon name="productions" class="h-3.5 w-3.5" />
            </span>
            <p class="text-[11px] text-ink-500">{{ t('coopProfile.strain') }}</p>
          </div>
          <p class="mt-2 truncate text-sm font-bold text-ink-900 sm:text-base">
            {{ props.coop.chickenStrain || '-' }}
          </p>
        </div>

        <div class="min-w-0 border-r border-slate-200/80 px-2 dark:!border-white/10">
          <div class="flex items-center gap-1.5">
            <span class="hidden h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 sm:grid dark:!bg-[rgba(59,130,246,0.12)]">
              <UiIcon name="users" class="h-3.5 w-3.5" />
            </span>
            <p class="text-[11px] text-ink-500">{{ t('coopProfile.population') }}</p>
          </div>
          <p class="mt-2 truncate text-sm font-bold text-ink-900 sm:text-base">
            {{ populationLabel }}
          </p>
        </div>

        <div class="min-w-0 pl-2">
          <div class="flex items-center gap-1.5">
            <span class="hidden h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 sm:grid dark:!bg-[rgba(255,116,32,0.12)]">
              <UiIcon name="calendar" class="h-3.5 w-3.5" />
            </span>
            <p class="text-[11px] text-ink-500">{{ t('coopProfile.age') }}</p>
          </div>
          <p class="mt-2 text-sm font-bold leading-tight sm:text-base" :class="age.tone">
            {{ age.main }}
          </p>
          <p class="mt-0.5 truncate text-[10px] text-ink-500">{{ age.since }}</p>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 border-t border-emerald-100/70 bg-emerald-50/45 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:!border-emerald-400/15 dark:!bg-[rgba(16,185,129,0.08)]">
      <UiIcon name="arrowUp" class="h-3.5 w-3.5" />
      <span>{{ t('coopProfile.activeProfile') }}</span>
    </div>
  </article>
</template>
