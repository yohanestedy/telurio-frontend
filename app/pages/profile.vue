<script setup lang="ts">
definePageMeta({
  title: 'Profile and Security',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
})

const api = useApi()
const auth = useAuthStore()
const toast = useToast()
const { logout } = useAuth()
const submitting = ref(false)
const logoutDialogOpen = ref(false)

async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  submitting.value = true
  try {
    await api.patch('/auth/me/password', payload)
    toast.success('Password berhasil diubah')
  } catch (caught) {
    toast.error('Gagal mengubah password', api.mapError(caught).message)
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
      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Profil</p>
      <h2 class="mt-3 text-2xl font-semibold text-ink-900">{{ auth.user.name }}</h2>
      <p class="mt-2 text-sm text-ink-600">{{ auth.user.username }} • {{ roleLabel(auth.user.role) }}</p>

      <div class="mt-6 space-y-3">
        <div class="rounded-2xl border border-white/40 bg-white/60 px-4 py-3 text-sm">
          <span class="font-medium text-ink-800">Status</span>
          <span class="ml-2 text-ink-600">{{ auth.user.isActive ? 'Aktif' : 'Nonaktif' }}</span>
        </div>
        <div class="rounded-2xl border border-white/40 bg-white/60 px-4 py-3 text-sm">
          <span class="font-medium text-ink-800">Akses kandang</span>
          <span class="ml-2 text-ink-600">{{ auth.user.coopAccesses.length }}</span>
        </div>
      </div>
    </GlassCard>

    <TableCard title="Keamanan" description="Ubah password akun untuk menjaga akses tetap aman." icon="key">
      <FormsChangePasswordForm :submitting="submitting" @submit="changePassword" />
      <div class="mt-4 flex justify-end">
        <UiButton variant="ghost" icon="logout" @click="logoutDialogOpen = true">Logout</UiButton>
      </div>
      <LogoutConfirmDialog v-model:open="logoutDialogOpen" @confirm="confirmLogout" />
    </TableCard>
  </div>
</template>
