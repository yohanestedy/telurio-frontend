<script setup lang="ts">
const ui = useUiStore()
const { t } = useI18n()

const nextLanguageLabel = computed(() => ui.language === 'id' ? 'EN' : 'ID')
const themeIcon = computed<'sun' | 'moon'>(() => ui.theme === 'dark' ? 'sun' : 'moon')
const themeLabel = computed(() => ui.theme === 'dark' ? t('topbar.lightMode') : t('topbar.darkMode'))
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
    <div class="absolute inset-0 bg-shell" />

    <div class="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
      <button
        type="button"
        class="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-ink-700 shadow-sm backdrop-blur-sm transition hover:bg-orange-50/80"
        :title="t('topbar.language')"
        :aria-label="t('topbar.language')"
        @click="ui.toggleLanguage()"
      >
        <UiIcon name="language" class="h-3.5 w-3.5 text-brand-700" />
        {{ nextLanguageLabel }}
      </button>
      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-ink-700 shadow-sm backdrop-blur-sm transition hover:bg-orange-50/80"
        :title="themeLabel"
        :aria-label="themeLabel"
        @click="ui.toggleTheme()"
      >
        <UiIcon :name="themeIcon" class="h-4 w-4 text-brand-700" />
      </button>
    </div>

    <div class="relative w-full max-w-md">
      <slot />
    </div>
  </div>
</template>
