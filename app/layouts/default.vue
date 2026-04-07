<template>
  <div class="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
    <AppSidebar />
    <div class="relative min-w-0">
      <BlurTopbar />
      <main class="page-wrap">
        <slot />
      </main>
      <MobileBottomNav />
    </div>
  </div>
</template>
