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

const age = computed(() => {
  if (!props.coop.chickBirthDate) {
    return {
      main: '-',
      since: 'Tanggal DOC belum diisi',
      tone: 'text-ink-700',
    }
  }

  const birthDate = dayjs(props.coop.chickBirthDate).startOf('day')
  const today = dayjs().startOf('day')

  if (!birthDate.isValid()) {
    return {
      main: '-',
      since: 'Tanggal DOC tidak valid',
      tone: 'text-ink-700',
    }
  }

  const totalDays = Math.max(today.diff(birthDate, 'day'), 0)
  const weeks = Math.floor(totalDays / 7)
  const days = totalDays % 7

  return {
    main: days > 0 ? `${weeks} minggu ${days} hari` : `${weeks} minggu`,
    since: `Sejak ${formatDate(props.coop.chickBirthDate)}`,
    tone: weeks >= 1 ? 'text-brand-700' : 'text-ink-900',
  }
})

const populationLabel = computed(() =>
  `${props.coop.population.toLocaleString('id-ID')} ekor`,
)
</script>

<template>
  <article class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75">
    <div class="p-3.5">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2.5">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <UiIcon name="coops" class="h-4.5 w-4.5" />
          </span>
          <div class="flex min-w-0 items-center gap-2">
            <p class="truncate text-sm font-semibold text-ink-900 sm:text-base">{{ props.coop.name }}</p>
            <span
              :class="[
                'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                props.coop.isActive
                  ? 'border-emerald-200 bg-emerald-100/80 text-emerald-700'
                  : 'border-ink-200 bg-ink-100/70 text-ink-600',
              ]"
            >
              {{ props.coop.isActive ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>
        </div>
        <button
          v-if="props.canUpdatePopulation"
          type="button"
          class="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white/70 text-ink-500 transition hover:bg-white hover:text-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-100"
          title="Update populasi"
          aria-label="Update populasi"
          @click="emit('updatePopulation', props.coop)"
        >
          <UiIcon name="edit" class="h-3.5 w-3.5" />
        </button>
      </div>

      <div class="mt-3 h-px bg-slate-200/75" />

      <div class="mt-3 grid grid-cols-[minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1.3fr)] gap-2">
        <div class="min-w-0 border-r border-slate-200/80 pr-2">
          <div class="flex items-center gap-1.5">
            <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <UiIcon name="productions" class="h-3.5 w-3.5" />
            </span>
            <p class="text-[11px] text-ink-500">Strain</p>
          </div>
          <p class="mt-2 truncate text-sm font-bold text-ink-900 sm:text-base">
            {{ props.coop.chickenStrain || '-' }}
          </p>
        </div>

        <div class="min-w-0 border-r border-slate-200/80 px-2">
          <div class="flex items-center gap-1.5">
            <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
              <UiIcon name="users" class="h-3.5 w-3.5" />
            </span>
            <p class="text-[11px] text-ink-500">Populasi</p>
          </div>
          <p class="mt-2 truncate text-sm font-bold text-ink-900 sm:text-base">
            {{ populationLabel }}
          </p>
        </div>

        <div class="min-w-0 pl-2">
          <div class="flex items-center gap-1.5">
            <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
              <UiIcon name="calendar" class="h-3.5 w-3.5" />
            </span>
            <p class="text-[11px] text-ink-500">Umur</p>
          </div>
          <p class="mt-2 text-sm font-bold leading-tight sm:text-base" :class="age.tone">
            {{ age.main }}
          </p>
          <p class="mt-0.5 truncate text-[10px] text-ink-500">{{ age.since }}</p>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 border-t border-emerald-100/70 bg-emerald-50/45 px-3.5 py-2.5 text-xs font-semibold text-emerald-700">
      <UiIcon name="arrowUp" class="h-3.5 w-3.5" />
      <span>Profil kandang aktif</span>
    </div>
  </article>
</template>
