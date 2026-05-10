<script setup lang="ts">
const ui = useUiStore()
const { scrollToFirstFormError } = useScrollToFirstFormError()

function handleDocumentSubmit(event: SubmitEvent) {
  const form = event.target instanceof HTMLFormElement ? event.target : null

  if (!form) {
    return
  }

  window.setTimeout(() => {
    if (form.querySelector('[data-field-error="true"], .text-rose-600')) {
      void scrollToFirstFormError(form)
    }
  }, 0)
}

onMounted(() => {
  ui.initializePreferences()
  document.addEventListener('submit', handleDocumentSubmit)
})

onBeforeUnmount(() => {
  document.removeEventListener('submit', handleDocumentSubmit)
})
</script>

<template>
  <div class="min-h-screen bg-shell text-ink-900">
    <NuxtLoadingIndicator color="#f35f10" />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ToastViewport />
    <UnauthorizedLogoutDialog />
  </div>
</template>
