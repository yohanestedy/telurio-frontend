<script setup lang="ts">
const auth = useAuthStore()
const menu = useRoleMenu()
const route = useRoute()
const { logout } = useAuth()
const { t } = useI18n()

const logoutDialogOpen = ref(false)
const expandedGroups = ref<Set<string>>(new Set())
const isLogoutDisabled = computed(() => auth.loading)

const userInitials = computed(() => {
  const name = auth.user?.name?.trim() ?? ''
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
})

onMounted(() => {
  void auth.bootstrap()
})

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
  <aside class="hidden border-r border-slate-200/70 bg-white/64 backdrop-blur-xl lg:block">
    <div class="sticky top-0 flex h-screen flex-col gap-6 px-4 pb-4 pt-2">
      <div class="glass-panel shrink-0 rounded-[28px] p-4">
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 p-1.5 text-white">
            <UiIcon name="productions" class="h-4 w-4" />
          </div>
          <h1 class="text-base font-bold uppercase tracking-[0.2em] text-ink-900">{{ t('topbar.appLabel') }}</h1>
        </div>
      </div>

      <nav class="glass-panel sidebar-scroll min-h-0 flex-1 overflow-y-auto rounded-[28px] p-3">
        <template v-for="item in menu.desktop" :key="item.path">
          <!-- Item with children: collapsible group -->
          <div v-if="item.children?.length">
            <UiTooltip :text="item.description">
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
                </div>
                <UiIcon
                  name="chevronDown"
                  class="h-3.5 w-3.5 text-ink-400 transition-transform duration-200"
                  :class="isGroupExpanded(item) ? 'rotate-180' : ''"
                />
              </button>
            </UiTooltip>
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              leave-active-class="transition-all duration-150 ease-in"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-40 opacity-100"
              leave-from-class="max-h-40 opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div v-show="isGroupExpanded(item)" class="overflow-hidden pl-5">
                <UiTooltip
                  v-for="child in item.children"
                  :key="child.path"
                  :text="child.description"
                >
                  <NuxtLink
                    :to="child.path"
                    class="mb-1 flex items-center gap-3 rounded-2xl px-4 py-2.5 transition hover:bg-orange-50/70"
                    active-class="bg-gradient-to-r from-brand-500 to-brand-700 text-white shadow-[0_16px_36px_rgba(243,95,16,0.18)]"
                  >
                    <div class="rounded-lg bg-orange-50/80 p-1.5 text-brand-700 transition">
                      <UiIcon :name="child.icon" class="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div class="text-sm font-medium">{{ child.label }}</div>
                    </div>
                  </NuxtLink>
                </UiTooltip>
              </div>
            </Transition>
          </div>

          <!-- Regular item -->
          <UiTooltip v-if="!item.children?.length" :text="item.description">
            <NuxtLink
              :to="item.path"
              class="mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-orange-50/70"
              active-class="bg-gradient-to-r from-brand-500 to-brand-700 text-white shadow-[0_16px_36px_rgba(243,95,16,0.18)]"
            >
              <div class="rounded-xl bg-orange-50/80 p-2 text-brand-700 transition">
                <UiIcon :name="item.icon" class="h-4 w-4" />
              </div>
              <div>
                <div class="font-medium">{{ item.label }}</div>
              </div>
            </NuxtLink>
          </UiTooltip>
        </template>
      </nav>

      <div v-if="auth.user || auth.role" class="glass-panel shrink-0 rounded-[28px] p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-semibold text-white">
            {{ userInitials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-ink-900">{{ auth.user?.name ?? '—' }}</p>
            <p class="text-[11px] font-medium uppercase tracking-[0.16em] text-brand-600">
              {{ auth.role ? t(`role.${auth.role}`) : '—' }}
            </p>
          </div>
        </div>

        <div class="my-3 h-px bg-slate-200/70 dark:!bg-white/10" />

        <div class="flex items-center justify-between gap-2 text-xs">
          <span class="flex items-center gap-1.5 text-ink-500">
            <UiIcon name="layers" class="h-3.5 w-3.5" />
            {{ t('common.scopeCoop') }}
          </span>
          <span class="font-semibold text-ink-900">{{ auth.user?.coopAccesses.length ?? 0 }}</span>
        </div>

        <div class="my-3 h-px bg-slate-200/70 dark:!bg-white/10" />

        <UiButton
          variant="ghost"
          size="sm"
          icon="logout"
          :disabled="isLogoutDisabled"
          class="w-full !justify-center"
          @click="logoutDialogOpen = true"
        >
          {{ t('common.logout') }}
        </UiButton>
      </div>

      <LogoutConfirmDialog v-model:open="logoutDialogOpen" @confirm="confirmLogout" />
    </div>
  </aside>
</template>

<style scoped>
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
}

.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.35);
  border-radius: 9999px;
}

.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(148, 163, 184, 0.6);
}
</style>
