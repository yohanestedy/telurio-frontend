<script setup lang="ts">
import { getPageIcon } from '../utils/icons'

const route = useRoute()
const auth = useAuthStore()

const title = computed(() => String(route.meta.title ?? 'Telurio'))
const subtitle = computed(() => {
  if (!auth.user) {
    return 'Egg Farm Management System'
  }

  return `${roleLabel(auth.user.role)} • ${auth.user.name}`
})

const pageIcon = computed(() => getPageIcon(route.path))
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
    <div class="mx-auto flex max-w-none items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3">
        <div class="surface-outline rounded-2xl p-2.5 text-brand-700">
          <UiIcon :name="pageIcon" class="h-5 w-5" />
        </div>
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.24em] text-brand-700/80">
            Telurio
          </p>
          <h1 class="text-xl font-semibold text-ink-900">{{ title }}</h1>
          <p class="text-sm text-ink-600">{{ subtitle }}</p>
        </div>
      </div>
      <div class="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-ink-600 shadow-[0_6px_20px_rgba(15,23,42,0.06)] sm:flex">
        <UiIcon name="calendar" class="h-4 w-4 text-brand-700" />
        {{ formatDate(new Date().toISOString(), 'dddd, DD MMM YYYY') }}
      </div>
    </div>
  </header>
</template>
