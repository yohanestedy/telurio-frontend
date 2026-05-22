<script setup lang="ts">
import { getPageIcon } from '../utils/icons'
import type { AppIconName } from '../utils/icons'

const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()
const { t } = useI18n()

const title = computed(() => t(`page.title.${String(route.meta.title ?? 'Telurio')}`))
const subtitle = computed(() => {
  if (!auth.user) {
    return t('topbar.guestSubtitle')
  }

  return `${t(`role.${auth.user.role}`)} • ${auth.user.name}`
})

const pageIcon = computed(() => getPageIcon(route.path))
const nextLanguageLabel = computed(() => ui.language === 'id' ? 'EN' : 'ID')
const themeIcon = computed<AppIconName>(() => ui.theme === 'dark' ? 'sun' : 'moon')
const themeLabel = computed(() => ui.theme === 'dark' ? t('topbar.lightMode') : t('topbar.darkMode'))
const todayLabel = computed(() =>
  new Intl.DateTimeFormat(ui.language === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date()),
)
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
    <div class="mx-auto flex max-w-none items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div class="min-w-0 flex items-center gap-3">
        <div class="surface-outline rounded-2xl p-2.5 text-brand-700">
          <UiIcon :name="pageIcon" class="h-5 w-5" />
        </div>
        <div class="min-w-0">
          <!-- <p class="text-xs font-medium uppercase tracking-[0.24em] text-brand-700/80">
            {{ t('topbar.appLabel') }}
          </p> -->
          <h1 class="truncate text-xl font-semibold text-ink-900">{{ title }}</h1>
          <p class="truncate text-sm text-ink-600">{{ subtitle }}</p>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-ink-700 shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition hover:bg-orange-50/80"
          :title="t('topbar.language')"
          :aria-label="t('topbar.language')"
          @click="ui.toggleLanguage()"
        >
          <UiIcon name="language" class="h-4 w-4 text-brand-700" />
          {{ nextLanguageLabel }}
        </button>
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-ink-700 shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition hover:bg-orange-50/80"
          :title="themeLabel"
          :aria-label="themeLabel"
          @click="ui.toggleTheme()"
        >
          <UiIcon :name="themeIcon" class="h-4 w-4 text-brand-700" />
        </button>
        <div class="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-ink-600 shadow-[0_6px_20px_rgba(15,23,42,0.06)] md:flex">
          <UiIcon name="calendar" class="h-4 w-4 text-brand-700" />
          {{ todayLabel }}
        </div>
      </div>
    </div>
  </header>
</template>
