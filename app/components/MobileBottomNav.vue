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
      class="fixed inset-0 z-40 bg-ink-900/20 backdrop-blur-[2px] lg:hidden"
      @click.self="closePanels"
    >
      <div v-if="activePanel === 'quick'" class="absolute inset-x-0 bottom-[5.5rem] px-3">
        <div
          ref="quickPanelRef"
          class="mx-auto max-w-xl rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(248,250,252,0.94))] p-4 shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-ink-900">Quick action</p>
              <p class="text-xs text-ink-500">Akses aksi yang paling sering dipakai dari mobile.</p>
            </div>
            <UiButton variant="ghost" size="sm" icon="close" @click="closePanels">
              Tutup
            </UiButton>
          </div>

          <div class="grid gap-2">
            <NuxtLink
              v-for="item in quickActions"
              :key="item.key"
              :to="item.to"
              class="rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 transition hover:bg-white"
              @click="closePanels"
            >
              <div class="flex items-start gap-3">
                <div class="rounded-2xl border border-brand-100 bg-brand-50 p-2 text-brand-700">
                  <UiIcon :name="item.icon" class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-ink-900">{{ item.label }}</p>
                    <span
                      v-if="item.badge"
                      class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
                    >
                      {{ item.badge }}
                    </span>
                  </div>
                  <p class="mt-0.5 text-xs leading-5 text-ink-500">{{ item.description }}</p>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <div v-else class="absolute inset-x-0 bottom-[5.5rem] px-3">
        <div
          ref="morePanelRef"
          class="mx-auto max-w-xl rounded-[28px] border border-white/70 bg-white/95 p-4 shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
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

  <nav class="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/90 px-3 py-3 backdrop-blur-xl lg:hidden">
    <div class="mx-auto grid max-w-xl grid-cols-5 items-end gap-2">
      <NuxtLink
        v-for="item in leftItems"
        :key="item.path"
        :to="item.path"
        class="rounded-2xl px-3 py-2 text-center text-xs font-medium text-ink-600 transition"
        active-class="bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-soft"
      >
        <div class="flex flex-col items-center gap-1">
          <UiIcon :name="item.icon" class="h-4 w-4" />
          <span>{{ item.label }}</span>
        </div>
      </NuxtLink>

      <button
        class="flex flex-col items-center gap-1 text-center text-xs font-medium text-ink-700"
        @click="togglePanel('quick')"
      >
        <span
          class="flex h-14 w-14 items-center justify-center rounded-full border border-brand-600/30 bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-[0_16px_32px_rgba(22,101,52,0.28)] transition"
          :class="activePanel === 'quick' ? 'scale-[1.03]' : ''"
        >
          <UiIcon name="plus" class="h-5 w-5" />
        </span>
        <span>Quick</span>
      </button>

      <NuxtLink
        v-for="item in rightItems"
        :key="item.path"
        :to="item.path"
        class="rounded-2xl px-3 py-2 text-center text-xs font-medium text-ink-600 transition"
        active-class="bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-soft"
      >
        <div class="flex flex-col items-center gap-1">
          <UiIcon :name="item.icon" class="h-4 w-4" />
          <span>{{ item.label }}</span>
        </div>
      </NuxtLink>

      <button
        class="rounded-2xl px-3 py-2 text-center text-xs font-medium transition"
        :class="activePanel === 'more' || isMoreActive ? 'bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-soft' : 'text-ink-600'"
        @click="togglePanel('more')"
      >
        <div class="flex flex-col items-center gap-1">
          <UiIcon :name="moreItem.icon" class="h-4 w-4" />
          <span>{{ moreItem.label }}</span>
        </div>
      </button>
    </div>
  </nav>

  <LogoutConfirmDialog v-model:open="logoutDialogOpen" @confirm="confirmLogout" />
</template>
