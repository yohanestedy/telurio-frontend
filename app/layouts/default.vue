<script setup lang="ts">
const route = useRoute()

const hideTopbarOnMobile = computed(() => Boolean(route.meta.hideMobileTopbar))
</script>

<template>
  <div class="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
    <AppSidebar />
    <div class="relative min-w-0">
      <BlurTopbar :class="hideTopbarOnMobile ? 'hidden lg:block' : ''" />
      <main class="page-wrap">
        <slot />
      </main>
      <MobileBottomNav />
    </div>
  </div>
</template>
