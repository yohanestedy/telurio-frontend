<script setup lang="ts">
const auth = useAuthStore()
const menu = useRoleMenu()
const { logout } = useAuth()

const logoutDialogOpen = ref(false)

async function confirmLogout() {
  logoutDialogOpen.value = false
  await logout()
}
</script>

<template>
  <aside class="hidden border-r border-slate-200/70 bg-white/64 p-4 backdrop-blur-xl lg:block">
    <div class="sticky top-4 space-y-6">
      <div class="glass-panel rounded-[28px] p-5">
        <div class="flex items-start gap-3">
          <div class="rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 p-3 text-white shadow-[0_12px_24px_rgba(243,95,16,0.22)]">
            <UiIcon name="productions" class="h-5 w-5" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
              Telurio
            </p>
            <h2 class="mt-2 text-xl font-semibold text-ink-900">Egg Farm Management</h2>
            <p class="mt-2 text-sm text-ink-600">
              Operasional telur harian yang rapi, ringan, dan bisa dilacak.
            </p>
          </div>
        </div>
      </div>

      <nav class="glass-panel rounded-[28px] p-3">
        <NuxtLink
          v-for="item in menu.desktop"
          :key="item.path"
          :to="item.path"
          class="mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-orange-50/70"
          active-class="bg-gradient-to-r from-brand-500 to-brand-700 text-white shadow-[0_16px_36px_rgba(243,95,16,0.18)]"
        >
          <div class="rounded-xl bg-orange-50/80 p-2 text-brand-700 transition">
            <UiIcon :name="item.icon" class="h-4 w-4" />
          </div>
          <div>
            <div class="font-medium">{{ item.label }}</div>
            <div class="text-xs opacity-75">{{ item.description }}</div>
          </div>
        </NuxtLink>
      </nav>

      <div v-if="auth.user" class="glass-panel rounded-[28px] p-5">
        <p class="text-sm font-semibold text-ink-900">{{ auth.user.name }}</p>
        <p class="text-xs uppercase tracking-[0.2em] text-ink-500">{{ roleLabel(auth.user.role) }}</p>
        <p class="mt-3 text-xs text-ink-500">
          Scope kandang: {{ auth.user.coopAccesses.length || 0 }}
        </p>
        <div class="mt-4 flex justify-end">
          <UiButton variant="ghost" size="sm" icon="logout" @click="logoutDialogOpen = true">Logout</UiButton>
        </div>
      </div>

      <LogoutConfirmDialog v-model:open="logoutDialogOpen" @confirm="confirmLogout" />
    </div>
  </aside>
</template>
