<script setup lang="ts">
const menu = useRoleMenu()
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-white/50 bg-white/75 px-3 py-3 backdrop-blur-md lg:hidden">
    <div class="mx-auto grid max-w-xl grid-cols-4 gap-2">
      <NuxtLink
        v-for="item in menu.mobile"
        :key="item.path"
        :to="item.path"
        class="rounded-2xl px-3 py-2 text-center text-xs font-medium text-ink-600 transition"
        active-class="bg-brand-600 text-white"
      >
        {{ item.label }}
      </NuxtLink>
      <button
        @click="useAuth().logout()"
        class="rounded-2xl px-3 py-2 text-center text-xs font-medium text-ink-600 transition"
      >
        Logout
      </button>
    </div>
  </nav>
</template>
