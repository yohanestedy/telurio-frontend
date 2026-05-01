<script setup lang="ts">
definePageMeta({
  title: 'Profile and Security',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
})

const api = useApi()
const auth = useAuthStore()
const toast = useToast()
const { logout } = useAuth()
const { t } = useI18n()
const submitting = ref(false)
const logoutDialogOpen = ref(false)

async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  submitting.value = true
  try {
    await api.patch('/auth/me/password', payload)
    toast.success(t('profile.passwordChanged'))
  } catch (caught) {
    toast.error(t('profile.passwordChangeFailed'), api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function confirmLogout() {
  logoutDialogOpen.value = false
  await logout()
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
    <GlassCard v-if="auth.user">
      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">{{ t('profile.title') }}</p>
      <h2 class="mt-3 text-2xl font-semibold text-ink-900">{{ auth.user.name }}</h2>
      <p class="mt-2 text-sm text-ink-600">{{ auth.user.username }} • {{ roleLabel(auth.user.role) }}</p>

      <div class="mt-6 space-y-3">
        <div class="rounded-2xl border border-white/40 bg-white/60 px-4 py-3 text-sm">
          <span class="font-medium text-ink-800">{{ t('profile.status') }}</span>
          <span class="ml-2 text-ink-600">{{ auth.user.isActive ? t('common.active') : t('common.inactive') }}</span>
        </div>
        <div class="rounded-2xl border border-white/40 bg-white/60 px-4 py-3 text-sm">
          <span class="font-medium text-ink-800">{{ t('profile.coopAccess') }}</span>
          <span class="ml-2 text-ink-600">{{ auth.user.coopAccesses.length }}</span>
        </div>
      </div>
    </GlassCard>

    <TableCard :title="t('profile.securityTitle')" :description="t('profile.securityDescription')" icon="key">
      <FormsChangePasswordForm :submitting="submitting" @submit="changePassword" />
      <div class="mt-4 flex justify-end">
        <UiButton variant="ghost" icon="logout" @click="logoutDialogOpen = true">{{ t('common.logout') }}</UiButton>
      </div>
      <LogoutConfirmDialog v-model:open="logoutDialogOpen" @confirm="confirmLogout" />
    </TableCard>
  </div>
</template>
