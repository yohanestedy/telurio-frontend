<script setup lang="ts">
const menu = useRoleMenu()
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 px-3 py-3 backdrop-blur-xl lg:hidden">
    <div class="mx-auto grid max-w-xl grid-cols-4 gap-2">
      <NuxtLink
        v-for="item in menu.mobile"
        :key="item.path"
        :to="item.path"
        class="rounded-2xl px-3 py-2 text-center text-xs font-medium text-ink-600 transition"
        active-class="bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-soft"
      >
        <div class="flex flex-col items-center gap-1">
          <UiIcon :name="item.icon" class="h-4 w-4" />
          <span>{{ item.label }}</span>
        </div>
      </NuxtLink>
      <button
        @click="useAuth().logout()"
        class="rounded-2xl px-3 py-2 text-center text-xs font-medium text-ink-600 transition"
      >
        <div class="flex flex-col items-center gap-1">
          <UiIcon name="logout" class="h-4 w-4" />
          <span>Logout</span>
        </div>
      </button>
    </div>
  </nav>
</template>
