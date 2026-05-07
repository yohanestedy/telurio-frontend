<script setup lang="ts">
const auth = useAuthStore()
const menu = useRoleMenu()
const route = useRoute()
const { logout } = useAuth()
const { t } = useI18n()

const logoutDialogOpen = ref(false)
const expandedGroups = ref<Set<string>>(new Set())

function isGroupActive(item: { path: string; children?: Array<{ path: string }> }) {
  if (!item.children) return false
  return item.children.some((child) => route.path === child.path || route.path.startsWith(`${child.path}/`))
}

function toggleGroup(path: string) {
  if (expandedGroups.value.has(path)) {
    expandedGroups.value.delete(path)
  } else {
    expandedGroups.value.add(path)
  }
}

function isGroupExpanded(item: { path: string; children?: Array<{ path: string }> }) {
  return expandedGroups.value.has(item.path) || isGroupActive(item)
}

async function confirmLogout() {
  logoutDialogOpen.value = false
  await logout()
}
</script>

<template>
  <aside class="hidden border-r border-slate-200/70 bg-white/64 p-4 backdrop-blur-xl lg:block">
    <div class="sticky top-4 space-y-6">
      <!-- <div class="glass-panel rounded-[28px] p-5">
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
      </div> -->

      <nav class="glass-panel rounded-[28px] p-3">
        <template v-for="item in menu.desktop" :key="item.path">
          <!-- Item with children: collapsible group -->
          <div v-if="item.children?.length">
            <button
              type="button"
              class="mb-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-orange-50/70"
              :class="isGroupActive(item) ? 'bg-orange-50/70' : ''"
              @click="toggleGroup(item.path)"
            >
              <div class="rounded-xl bg-orange-50/80 p-2 text-brand-700 transition">
                <UiIcon :name="item.icon" class="h-4 w-4" />
              </div>
              <div class="flex-1">
                <div class="font-medium">{{ item.label }}</div>
                <div class="text-xs opacity-75">{{ item.description }}</div>
              </div>
              <UiIcon
                name="chevronDown"
                class="h-3.5 w-3.5 text-ink-400 transition-transform duration-200"
                :class="isGroupExpanded(item) ? 'rotate-180' : ''"
              />
            </button>
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              leave-active-class="transition-all duration-150 ease-in"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-40 opacity-100"
              leave-from-class="max-h-40 opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div v-show="isGroupExpanded(item)" class="overflow-hidden pl-5">
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.path"
                  :to="child.path"
                  class="mb-1 flex items-center gap-3 rounded-2xl px-4 py-2.5 transition hover:bg-orange-50/70"
                  active-class="bg-gradient-to-r from-brand-500 to-brand-700 text-white shadow-[0_16px_36px_rgba(243,95,16,0.18)]"
                >
                  <div class="rounded-lg bg-orange-50/80 p-1.5 text-brand-700 transition">
                    <UiIcon :name="child.icon" class="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div class="text-sm font-medium">{{ child.label }}</div>
                    <div class="text-[11px] opacity-75">{{ child.description }}</div>
                  </div>
                </NuxtLink>
              </div>
            </Transition>
          </div>

          <!-- Regular item -->
          <NuxtLink
            v-else
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
        </template>
      </nav>

      <div v-if="auth.user" class="glass-panel rounded-[28px] p-5">
        <p class="text-sm font-semibold text-ink-900">{{ auth.user.name }}</p>
        <p class="text-xs uppercase tracking-[0.2em] text-ink-500">{{ t(`role.${auth.user.role}`) }}</p>
        <p class="mt-3 text-xs text-ink-500">
          {{ t('common.scopeCoop') }}: {{ auth.user.coopAccesses.length || 0 }}
        </p>
        <div class="mt-4 flex justify-end">
          <UiButton variant="ghost" size="sm" icon="logout" @click="logoutDialogOpen = true">
            {{ t('common.logout') }}
          </UiButton>
        </div>
      </div>

      <LogoutConfirmDialog v-model:open="logoutDialogOpen" @confirm="confirmLogout" />
    </div>
  </aside>
</template>
