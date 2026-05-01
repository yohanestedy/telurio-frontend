<script setup lang="ts">
const ui = useUiStore()
const { logout } = useAuth()
const { t } = useI18n()
const pending = ref(false)

async function confirmLogout() {
  if (pending.value) {
    return
  }

  pending.value = true
  try {
    ui.closeUnauthorizedDialog()
    await logout()
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UiDialog
    :open="ui.unauthorizedDialog.open"
    :title="ui.unauthorizedDialog.title"
    :description="ui.unauthorizedDialog.message"
    :closable="false"
    size="md"
  >
    <div class="space-y-5">
      <div class="rounded-2xl border border-brand-200/80 bg-brand-50/85 px-4 py-3 text-sm text-[#8f4518]">
        {{ t('session.securityNote') }}
      </div>

      <div class="flex justify-end">
        <UiButton :disabled="pending" icon="logout" @click="confirmLogout">
          {{ pending ? t('common.processing') : t('session.logoutNow') }}
        </UiButton>
      </div>
    </div>
  </UiDialog>
</template>
