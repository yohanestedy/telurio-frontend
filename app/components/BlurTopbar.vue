<script setup lang="ts">
const route = useRoute()
const auth = useAuthStore()

const title = computed(() => String(route.meta.title ?? 'Telurio'))
const subtitle = computed(() => {
  if (!auth.user) {
    return 'Egg Farm Management System'
  }

  return `${roleLabel(auth.user.role)} • ${auth.user.name}`
})
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-white/40 bg-white/55 backdrop-blur-md">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div>
        <p class="text-xs font-medium uppercase tracking-[0.24em] text-brand-700/80">
          Telurio
        </p>
        <h1 class="text-xl font-semibold text-ink-900">{{ title }}</h1>
        <p class="text-sm text-ink-600">{{ subtitle }}</p>
      </div>
      <div class="hidden rounded-full border border-white/50 bg-white/70 px-4 py-2 text-sm text-ink-600 sm:block">
        {{ formatDate(new Date().toISOString(), 'dddd, DD MMM YYYY') }}
      </div>
    </div>
  </header>
</template>
