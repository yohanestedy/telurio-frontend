<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

const menu = useRoleMenu()
const route = useRoute()
const { logout } = useAuth()

const moreOpen = ref(false)
const morePanelRef = ref<HTMLElement | null>(null)
const logoutDialogOpen = ref(false)

const primaryItems = computed(() =>
  menu.value.mobile.filter((item) => item.label !== 'More').slice(0, 3),
)

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

const isMoreActive = computed(() =>
  moreItems.value.some((item) => route.path === item.path || route.path.startsWith(`${item.path}/`)),
)

function closeMore() {
  moreOpen.value = false
}

function toggleMore() {
  moreOpen.value = !moreOpen.value
}

async function confirmLogout() {
  logoutDialogOpen.value = false
  closeMore()
  await logout()
}

onClickOutside(morePanelRef, () => {
  closeMore()
})

watch(
  () => route.path,
  () => {
    closeMore()
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="moreOpen"
      class="fixed inset-0 z-40 bg-ink-900/20 backdrop-blur-[2px] lg:hidden"
      @click.self="closeMore"
    >
      <div class="absolute inset-x-0 bottom-[5.5rem] px-3">
        <div
          ref="morePanelRef"
          class="mx-auto max-w-xl rounded-[28px] border border-white/70 bg-white/95 p-4 shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-ink-900">Menu lainnya</p>
              <p class="text-xs text-ink-500">Akses halaman lain sesuai peran akun Anda.</p>
            </div>
            <UiButton variant="ghost" size="sm" icon="close" @click="closeMore">
              Tutup
            </UiButton>
          </div>

          <div class="grid gap-2">
            <NuxtLink
              v-for="item in moreItems"
              :key="item.path"
              :to="item.path"
              class="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 transition hover:bg-slate-50"
              @click="closeMore"
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
    <div class="mx-auto grid max-w-xl grid-cols-4 gap-2">
      <NuxtLink
        v-for="item in primaryItems"
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
        :class="moreOpen || isMoreActive ? 'bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-soft' : 'text-ink-600'"
        @click="toggleMore"
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
