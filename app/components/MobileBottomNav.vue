<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import type { AppIconName } from '../utils/icons'
import type { MenuItem } from '../types/domain'

type QuickAction = {
  key: string
  label: string
  description: string
  icon: AppIconName
  to: { path: string; query?: Record<string, string> }
  badge?: string
}

const menu = useRoleMenu()
const route = useRoute()
const auth = useAuthStore()
const { logout } = useAuth()
const { todayPriceMissing, loadTodayPriceStatus } = useTodayPriceStatus()
const { t } = useI18n()

const activePanel = ref<'more' | 'quick' | null>(null)
const morePanelRef = ref<HTMLElement | null>(null)
const quickPanelRef = ref<HTMLElement | null>(null)
const logoutDialogOpen = ref(false)

const primaryItems = computed(() =>
  menu.value.mobile.filter((item) => item.icon !== 'more').slice(0, 3),
)

const leftItems = computed(() => primaryItems.value.slice(0, 2))
const rightItems = computed(() => primaryItems.value.slice(2))

const moreItem = computed<MenuItem>(() =>
  menu.value.mobile.find((item) => item.icon === 'more') ?? {
    label: t('menu.label.More'),
    path: '/profile',
    description: t('menu.description.Menu lainnya'),
    permission: 'profile.view',
    icon: 'more',
  },
)

const moreItems = computed(() => {
  const primaryPaths = new Set(primaryItems.value.map((item) => item.path))
  return menu.value.desktop.filter((item) => !primaryPaths.has(item.path))
})

const quickActions = computed<QuickAction[]>(() => {
  if (auth.role === 'ADMIN') {
    return [
      {
        key: 'create-order',
        label: t('quick.createOrder'),
        description: t('quick.createOrderDescription'),
        icon: 'orders',
        to: { path: '/orders', query: { create: 'new' } },
      },
      ...(todayPriceMissing.value
        ? [{
            key: 'today-price',
            label: t('quick.todayPrice'),
            description: t('quick.todayPriceDescription'),
            icon: 'prices' as AppIconName,
            to: { path: '/prices', query: { create: 'today' } },
            badge: t('quick.todayBadge'),
          }]
        : []),
    ]
  }

  if (auth.role === 'OWNER') {
    return [
      {
        key: 'create-expense',
        label: t('quick.createExpense'),
        description: t('quick.createExpenseDescription'),
        icon: 'expenses',
        to: { path: '/expenses', query: { create: 'new' } },
      },
    ]
  }

  return [
    {
      key: 'create-production',
      label: t('quick.createProduction'),
      description: t('quick.createProductionDescription'),
      icon: 'productions',
      to: { path: '/productions', query: { create: 'new' } },
    },
  ]
})

const isMoreActive = computed(() =>
  moreItems.value.some((item) => route.path === item.path || route.path.startsWith(`${item.path}/`)),
)

function isItemActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

function closePanels() {
  activePanel.value = null
}

function togglePanel(panel: 'more' | 'quick') {
  activePanel.value = activePanel.value === panel ? null : panel
}

async function confirmLogout() {
  logoutDialogOpen.value = false
  closePanels()
  await logout()
}

onClickOutside(morePanelRef, () => {
  if (activePanel.value === 'more') {
    closePanels()
  }
})

onClickOutside(quickPanelRef, () => {
  if (activePanel.value === 'quick') {
    closePanels()
  }
})

watch(
  () => route.fullPath,
  () => {
    closePanels()
  },
)

watch(
  () => activePanel.value,
  async (panel) => {
    if (panel === 'quick' && auth.role === 'ADMIN') {
      await loadTodayPriceStatus()
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="activePanel"
      class="fixed inset-0 z-40 bg-ink-900/18 backdrop-blur-[3px] lg:hidden"
      @click.self="closePanels"
    >
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-8 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-8 opacity-0"
        appear
      >
      <div v-if="activePanel === 'quick'" class="absolute inset-x-0 bottom-0">
        <div
          ref="quickPanelRef"
          class="mx-auto max-w-xl rounded-t-[42px] border-x border-t border-white/20 bg-[linear-gradient(180deg,#ff7a21_0%,#f7691b_58%,#ef5e17_100%)] px-6 pb-[8.5rem] pt-7 text-white shadow-[0_-18px_54px_rgba(239,94,23,0.28)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#a13a12_0%,#7f2d12_58%,#4a2015_100%)]"
        >
          <div class="mx-auto mb-5 h-1.5 w-14 rounded-full bg-white/35" />

          <div class="mb-5 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-base font-semibold">{{ t('mobile.quickAction') }}</p>
              <p class="mt-1 text-sm text-white/80">{{ t('mobile.quickActionDescription') }}</p>
            </div>
            <button
              class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/24 bg-white/12 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/18"
              @click="closePanels"
            >
              <UiIcon name="close" class="h-3.5 w-3.5" />
              <span>{{ t('common.close') }}</span>
            </button>
          </div>

          <div class="grid gap-2.5">
            <NuxtLink
              v-for="item in quickActions"
              :key="item.key"
              :to="item.to"
              class="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 transition hover:bg-white/16"
              @click="closePanels"
            >
              <div class="flex items-start gap-3">
                <div
                  class="rounded-2xl border border-white/95 bg-[#fffaf5] p-2.5 text-[#e25f16] shadow-[0_8px_18px_rgba(0,0,0,0.12)] dark:border-white/15 dark:bg-[#f6f1eb] dark:text-[#ca470c]"
                >
                  <UiIcon :name="item.icon" class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-white">{{ item.label }}</p>
                    <span
                      v-if="item.badge"
                      class="rounded-full bg-white/18 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                    >
                      {{ item.badge }}
                    </span>
                  </div>
                  <p class="mt-0.5 text-xs leading-5 text-white/78">{{ item.description }}</p>
                </div>
              </div>
            </NuxtLink>
          </div>

        </div>
      </div>
      </Transition>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-4 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-4 opacity-0"
        appear
      >
      <div v-if="activePanel === 'more'" class="absolute inset-x-0 bottom-[6.25rem] px-3">
        <div
          ref="morePanelRef"
          class="mx-auto max-w-xl rounded-[30px] border border-white/70 bg-white/96 p-4 shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-ink-900">{{ t('mobile.moreTitle') }}</p>
              <p class="text-xs text-ink-500">{{ t('mobile.moreDescription') }}</p>
            </div>
            <UiButton variant="ghost" size="sm" icon="close" @click="closePanels">
              {{ t('common.close') }}
            </UiButton>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <NuxtLink
              v-for="item in moreItems"
              :key="item.path"
              :to="item.path"
              class="min-h-[4.75rem] rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-3 transition hover:bg-slate-50"
              @click="closePanels"
            >
              <div class="flex h-full items-center gap-2.5">
                <div class="shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-2 text-brand-700">
                  <UiIcon :name="item.icon" class="h-4 w-4" />
                </div>
                <p class="min-w-0 text-sm font-semibold leading-tight text-ink-900">{{ item.label }}</p>
              </div>
            </NuxtLink>

            <button
              class="col-span-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left transition hover:bg-slate-50"
              @click="logoutDialogOpen = true"
            >
              <div class="flex items-start gap-3">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-ink-700">
                  <UiIcon name="logout" class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-ink-900">{{ t('common.logout') }}</p>
                  <p class="mt-0.5 text-xs leading-5 text-ink-500">{{ t('mobile.logoutDescription') }}</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
      </Transition>
    </div>
  </Teleport>

  <nav class="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 max-[380px]:px-2 max-[380px]:pb-[max(0.45rem,env(safe-area-inset-bottom))] max-[380px]:pt-1.5 lg:hidden">
    <div class="relative mx-auto max-w-xl">
      <div
        class="pointer-events-none absolute inset-x-14 top-1.5 h-14 rounded-[24px] bg-[linear-gradient(180deg,rgba(255,163,94,0.72)_0%,rgba(249,115,22,0.16)_100%)] blur-xl max-[380px]:inset-x-16 max-[380px]:top-1 max-[380px]:h-12 max-[380px]:rounded-[20px]"
        :class="activePanel === 'quick' ? 'opacity-0' : 'opacity-100'"
      />

      <div class="relative pt-2 max-[380px]:pt-1">
        <div
          class="relative z-10 grid grid-cols-5 items-end gap-1 rounded-[30px] px-2 pb-2 pt-1.5 backdrop-blur-xl transition-colors duration-200 max-[380px]:gap-0.5 max-[380px]:rounded-[26px] max-[380px]:px-1.5 max-[380px]:pb-1.5 max-[380px]:pt-1"
          :class="activePanel === 'quick'
            ? 'border border-orange-100/90 bg-white/98 shadow-[0_18px_44px_rgba(15,23,42,0.22)] ring-1 ring-white/80 dark:border-white/10 dark:bg-[#1c1916]/95 dark:ring-white/10'
            : 'border border-white/90 bg-white/96 shadow-[0_16px_34px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#1c1916]/90'"
        >
          <NuxtLink
            v-for="item in leftItems"
            :key="item.path"
            :to="item.path"
            class="px-2.5 py-1.5 text-center text-[11px] font-medium transition-colors max-[380px]:px-1.5 max-[380px]:py-1 max-[380px]:text-[10px]"
            :class="isItemActive(item.path) ? 'text-[#ef5e17]' : 'text-ink-500'"
          >
            <div class="flex flex-col items-center gap-1 max-[380px]:gap-0.5">
              <UiIcon :name="item.icon" class="h-[1.125rem] w-[1.125rem] transition-colors" />
              <span>{{ item.label }}</span>
            </div>
          </NuxtLink>

          <button
            class="relative z-20 flex flex-col items-center gap-1 text-center text-[11px] font-medium text-ink-600"
            :aria-label="t('mobile.quickAction')"
            @click="togglePanel('quick')"
          >
            <span
              class="flex h-[3.9rem] w-[3.9rem] -translate-y-[1.75rem] items-center justify-center rounded-full border-[5px] shadow-[0_14px_28px_rgba(249,115,22,0.34)] transition max-[380px]:h-[3.45rem] max-[380px]:w-[3.45rem] max-[380px]:-translate-y-[1.45rem] max-[380px]:border-[4px]"
              :class="activePanel === 'quick'
                ? 'scale-[1.04] border-orange-100 bg-[#fffaf5] text-[#ef5e17] dark:border-white/15 dark:bg-[#f6f1eb] dark:text-[#ca470c]'
                : 'border-white bg-[linear-gradient(180deg,#ff8a2d_0%,#f97316_100%)] text-white'"
            >
              <UiIcon name="plus" class="h-7 w-7 max-[380px]:h-6 max-[380px]:w-6" />
            </span>
            <span class="sr-only">{{ t('mobile.quickAction') }}</span>
          </button>

          <NuxtLink
            v-for="item in rightItems"
            :key="item.path"
            :to="item.path"
            class="px-2.5 py-1.5 text-center text-[11px] font-medium transition-colors max-[380px]:px-1.5 max-[380px]:py-1 max-[380px]:text-[10px]"
            :class="isItemActive(item.path) ? 'text-[#ef5e17]' : 'text-ink-500'"
          >
            <div class="flex flex-col items-center gap-1 max-[380px]:gap-0.5">
              <UiIcon :name="item.icon" class="h-[1.125rem] w-[1.125rem] transition-colors" />
              <span>{{ item.label }}</span>
            </div>
          </NuxtLink>

          <button
            class="px-2.5 py-1.5 text-center text-[11px] font-medium transition-colors max-[380px]:px-1.5 max-[380px]:py-1 max-[380px]:text-[10px]"
            :class="activePanel === 'more' || isMoreActive ? 'text-[#ef5e17]' : 'text-ink-500'"
            @click="togglePanel('more')"
          >
            <div class="flex flex-col items-center gap-1 max-[380px]:gap-0.5">
              <UiIcon :name="moreItem.icon" class="h-[1.125rem] w-[1.125rem] transition-colors" />
              <span>{{ moreItem.label }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <LogoutConfirmDialog v-model:open="logoutDialogOpen" @confirm="confirmLogout" />
</template>
