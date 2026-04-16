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
