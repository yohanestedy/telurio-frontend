<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import type { AppIconName } from '../utils/icons'

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

const activePanel = ref<'more' | 'quick' | null>(null)
const morePanelRef = ref<HTMLElement | null>(null)
const quickPanelRef = ref<HTMLElement | null>(null)
const logoutDialogOpen = ref(false)

const primaryItems = computed(() =>
  menu.value.mobile.filter((item) => item.label !== 'More').slice(0, 3),
)

const leftItems = computed(() => primaryItems.value.slice(0, 2))
const rightItems = computed(() => primaryItems.value.slice(2))

const moreItem = computed(() =>
  menu.value.mobile.find((item) => item.label === 'More') ?? {
    label: 'More',
    path: '/profile',
    description: 'Menu lainnya',
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
        label: 'Tambah order',
        description: 'Buat pesanan baru langsung dari mobile.',
        icon: 'orders',
        to: { path: '/orders', query: { create: 'new' } },
      },
      ...(todayPriceMissing.value
        ? [{
            key: 'today-price',
            label: 'Input harga hari ini',
            description: 'Lengkapi harga harian agar order hari ini bisa diproses.',
            icon: 'prices',
            to: { path: '/prices', query: { create: 'today' } },
            badge: 'Hari ini',
          }]
        : []),
    ]
  }

  if (auth.role === 'OWNER') {
    return [
      {
        key: 'create-expense',
        label: 'Tambah expense',
        description: 'Catat pengeluaran kandang dengan cepat.',
        icon: 'expenses',
        to: { path: '/expenses', query: { create: 'new' } },
      },
    ]
  }

  return [
    {
      key: 'create-production',
      label: 'Tambah produksi',
      description: 'Input hasil produksi harian secara langsung.',
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
      <div v-if="activePanel === 'quick'" class="absolute inset-x-0 bottom-0">
        <div
          ref="quickPanelRef"
          class="mx-auto max-w-xl rounded-t-[42px] border-x border-t border-white/20 bg-[linear-gradient(180deg,#ff7a21_0%,#f7691b_58%,#ef5e17_100%)] px-6 pb-8 pt-7 text-white shadow-[0_-18px_54px_rgba(239,94,23,0.28)]"
        >
          <div class="mx-auto mb-5 h-1.5 w-14 rounded-full bg-white/35" />

          <div class="mb-5 text-center">
            <p class="text-base font-semibold">Quick action</p>
            <p class="mt-1 text-sm text-white/80">Akses aksi utama tanpa perlu pindah-pindah halaman.</p>
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
                  class="rounded-2xl border border-white/95 bg-white/95 p-2.5 text-[#e25f16] shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
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

          <div class="mt-8 flex justify-center">
            <button
              class="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#ef5e17] shadow-[0_14px_30px_rgba(0,0,0,0.16)] transition hover:scale-[1.02]"
              @click="closePanels"
            >
              <UiIcon name="close" class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div v-else class="absolute inset-x-0 bottom-[6.25rem] px-3">
        <div
          ref="morePanelRef"
          class="mx-auto max-w-xl rounded-[30px] border border-white/70 bg-white/96 p-4 shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-ink-900">Menu lainnya</p>
              <p class="text-xs text-ink-500">Akses halaman lain sesuai peran akun Anda.</p>
            </div>
            <UiButton variant="ghost" size="sm" icon="close" @click="closePanels">
              Tutup
            </UiButton>
          </div>

          <div class="grid gap-2">
            <NuxtLink
              v-for="item in moreItems"
              :key="item.path"
              :to="item.path"
              class="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 transition hover:bg-slate-50"
              @click="closePanels"
            >
              <div class="flex items-start gap-3">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-brand-700">
                  <UiIcon :name="item.icon" class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-ink-900">{{ item.label }}</p>
                  <p class="mt-0.5 text-xs leading-5 text-ink-500">{{ item.description }}</p>
                </div>
              </div>
            </NuxtLink>

            <button
              class="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left transition hover:bg-slate-50"
              @click="logoutDialogOpen = true"
            >
              <div class="flex items-start gap-3">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-ink-700">
                  <UiIcon name="logout" class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-ink-900">Logout</p>
                  <p class="mt-0.5 text-xs leading-5 text-ink-500">Keluar dari sesi akun saat ini.</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <nav class="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.95rem,env(safe-area-inset-bottom))] pt-3 lg:hidden">
    <div class="relative mx-auto max-w-xl">
      <div
        class="pointer-events-none absolute inset-x-12 top-2 h-16 rounded-[28px] bg-[linear-gradient(180deg,rgba(255,163,94,0.72)_0%,rgba(249,115,22,0.16)_100%)] blur-xl"
        :class="activePanel === 'quick' ? 'opacity-0' : 'opacity-100'"
      />

      <div class="relative pt-3">
        <div
          class="relative z-10 grid grid-cols-5 items-end gap-1 rounded-[34px] border border-white/90 bg-white/96 px-2 pb-3 pt-2 shadow-[0_20px_46px_rgba(15,23,42,0.14)] backdrop-blur-xl"
        >
          <NuxtLink
            v-for="item in leftItems"
            :key="item.path"
            :to="item.path"
            class="px-2.5 py-2 text-center text-[11px] font-medium transition-colors"
            :class="isItemActive(item.path) ? 'text-[#ef5e17]' : 'text-ink-500'"
          >
            <div class="flex flex-col items-center gap-1">
              <UiIcon :name="item.icon" class="h-4 w-4 transition-colors" />
              <span>{{ item.label }}</span>
            </div>
          </NuxtLink>

          <button
            class="relative z-20 flex flex-col items-center gap-1 text-center text-[11px] font-medium text-ink-600"
            aria-label="Quick action"
            @click="togglePanel('quick')"
          >
            <span
              class="flex h-[4.25rem] w-[4.25rem] -translate-y-[2.05rem] items-center justify-center rounded-full border-[6px] border-white bg-[linear-gradient(180deg,#ff8a2d_0%,#f97316_100%)] text-white shadow-[0_18px_34px_rgba(249,115,22,0.36)] transition"
              :class="activePanel === 'quick' ? 'scale-[1.04]' : ''"
            >
              <UiIcon name="plus" class="h-6 w-6" />
            </span>
            <span class="sr-only">Quick action</span>
          </button>

          <NuxtLink
            v-for="item in rightItems"
            :key="item.path"
            :to="item.path"
            class="px-2.5 py-2 text-center text-[11px] font-medium transition-colors"
            :class="isItemActive(item.path) ? 'text-[#ef5e17]' : 'text-ink-500'"
          >
            <div class="flex flex-col items-center gap-1">
              <UiIcon :name="item.icon" class="h-4 w-4 transition-colors" />
              <span>{{ item.label }}</span>
            </div>
          </NuxtLink>

          <button
            class="px-2.5 py-2 text-center text-[11px] font-medium transition-colors"
            :class="activePanel === 'more' || isMoreActive ? 'text-[#ef5e17]' : 'text-ink-500'"
            @click="togglePanel('more')"
          >
            <div class="flex flex-col items-center gap-1">
              <UiIcon :name="moreItem.icon" class="h-4 w-4 transition-colors" />
              <span>{{ moreItem.label }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <LogoutConfirmDialog v-model:open="logoutDialogOpen" @confirm="confirmLogout" />
</template>
