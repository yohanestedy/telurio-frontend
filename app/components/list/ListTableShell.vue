<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const props = withDefaults(defineProps<{
  filterApplied?: boolean
  pageRangeLabel: string
  currentLimit: number
  pageSizeOptions?: number[]
  loading?: boolean
  hasPrevPage?: boolean
  hasNextPage?: boolean
  tableHeightClass?: string
  sortMenuWidthClass?: string
  filterMenuWidthClass?: string
}>(), {
  filterApplied: false,
  pageSizeOptions: () => [10, 25, 50, 100],
  loading: false,
  hasPrevPage: false,
  hasNextPage: false,
  tableHeightClass: 'h-[420px]',
  sortMenuWidthClass: 'w-[min(92vw,22rem)]',
  filterMenuWidthClass: 'w-[min(92vw,24rem)]',
})

const emit = defineEmits<{
  previousPage: []
  nextPage: []
  changeLimit: [value: number]
}>()

const activeMenu = ref<'sort' | 'filter' | null>(null)
const sortMenuRef = ref<HTMLElement | null>(null)
const filterMenuRef = ref<HTMLElement | null>(null)
const perPageMenuOpen = ref(false)
const perPageMenuRef = ref<HTMLElement | null>(null)

function toggleMenu(menu: 'sort' | 'filter') {
  activeMenu.value = activeMenu.value === menu ? null : menu
  perPageMenuOpen.value = false
}

function togglePerPageMenu() {
  perPageMenuOpen.value = !perPageMenuOpen.value
  activeMenu.value = null
}

function closeMenus() {
  activeMenu.value = null
  perPageMenuOpen.value = false
}

function selectLimit(size: number) {
  perPageMenuOpen.value = false
  emit('changeLimit', size)
}

onClickOutside(sortMenuRef, () => {
  if (activeMenu.value === 'sort') {
    activeMenu.value = null
  }
})

onClickOutside(
  filterMenuRef,
  () => {
    if (activeMenu.value === 'filter') {
      activeMenu.value = null
    }
  },
  {
    ignore: ['[data-ui-date-picker-content="true"]'],
  },
)

onClickOutside(perPageMenuRef, () => {
  perPageMenuOpen.value = false
})
</script>

<template>
  <GlassCard :overflow-visible="true">
    <div
      class="relative mb-3 flex flex-wrap items-center justify-between gap-3"
      :class="activeMenu || perPageMenuOpen ? 'z-[55]' : 'z-20'"
    >
      <div class="flex items-center gap-2">
        <button
          type="button"
          title="Urutkan data"
          class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-ink-700 transition hover:bg-white"
          :class="{ 'border-brand-300 bg-brand-50 text-brand-700': activeMenu === 'sort' }"
          @click="toggleMenu('sort')"
        >
          <UiIcon name="sort" class="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Filter data"
          class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-ink-700 transition hover:bg-white"
          :class="{ 'border-brand-300 bg-brand-50 text-brand-700': activeMenu === 'filter' || filterApplied }"
          @click="toggleMenu('filter')"
        >
          <UiIcon name="filter" class="h-4 w-4" />
        </button>
      </div>

      <div class="relative flex items-center gap-1.5">
        <div class="h-6 w-px bg-slate-200" />
        <button
          type="button"
          title="Ubah jumlah data per halaman"
          class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-ink-700 transition hover:bg-white"
          :class="{ 'border-brand-300 bg-brand-50 text-brand-700': perPageMenuOpen }"
          @click="togglePerPageMenu"
        >
          <UiIcon name="layers" class="h-4 w-4" />
        </button>
        <p class="text-sm text-ink-700">{{ pageRangeLabel }}</p>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
          :disabled="loading || !hasPrevPage"
          @click="emit('previousPage')"
        >
          <UiIcon name="chevronLeft" class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
          :disabled="loading || !hasNextPage"
          @click="emit('nextPage')"
        >
          <UiIcon name="chevronRight" class="h-4 w-4" />
        </button>

        <div
          v-if="perPageMenuOpen"
          ref="perPageMenuRef"
          class="glass-popover absolute right-0 top-[calc(100%+0.55rem)] z-[120] w-36 rounded-2xl p-1.5"
        >
          <button
            v-for="size in props.pageSizeOptions"
            :key="size"
            type="button"
            class="w-full rounded-xl px-3 py-2 text-left text-sm transition"
            :class="currentLimit === size ? 'bg-brand-100/70 text-brand-800' : 'text-ink-700 hover:bg-slate-100/80'"
            @click="selectLimit(size)"
          >
            {{ size }} Item
          </button>
        </div>
      </div>

      <div
        v-if="activeMenu === 'sort'"
        ref="sortMenuRef"
        class="glass-popover absolute left-0 top-[calc(100%+0.55rem)] z-[120] rounded-2xl p-3"
        :class="sortMenuWidthClass"
      >
        <slot name="sort-menu" :close-menus="closeMenus" />
      </div>

      <div
        v-if="activeMenu === 'filter'"
        ref="filterMenuRef"
        class="glass-popover absolute left-0 top-[calc(100%+0.55rem)] z-[120] max-h-[calc(100dvh-12rem)] overflow-y-auto rounded-2xl p-3 sm:max-h-none sm:overflow-visible"
        :class="filterMenuWidthClass"
      >
        <slot name="filter-menu" :close-menus="closeMenus" />
      </div>
    </div>

    <div class="my-3 h-px bg-slate-200/80" />

    <div
      class="relative z-10 overflow-auto rounded-2xl border border-slate-200/80 bg-white/55"
      :class="tableHeightClass"
    >
      <slot />
    </div>
  </GlassCard>
</template>
