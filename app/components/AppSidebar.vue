<script setup lang="ts">
const auth = useAuthStore()
const menu = useRoleMenu()
</script>

<template>
  <aside class="hidden border-r border-white/40 bg-white/45 p-4 backdrop-blur-md lg:block">
    <div class="sticky top-4 space-y-6">
      <div class="glass-panel rounded-[28px] p-5">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
          Telurio
        </p>
        <h2 class="mt-2 text-xl font-semibold text-ink-900">Egg Farm Management</h2>
        <p class="mt-2 text-sm text-ink-600">
          Operasional telur harian yang rapi, ringan, dan bisa dilacak.
        </p>
      </div>

      <nav class="glass-panel rounded-[28px] p-3">
        <NuxtLink
          v-for="item in menu.desktop"
          :key="item.path"
          :to="item.path"
          class="mb-1 block rounded-2xl px-4 py-3 transition hover:bg-white/60"
          active-class="bg-brand-600 text-white shadow-soft"
        >
          <div class="font-medium">{{ item.label }}</div>
          <div class="text-xs opacity-75">{{ item.description }}</div>
        </NuxtLink>
      </nav>

      <div v-if="auth.user" class="glass-panel rounded-[28px] p-5">
        <p class="text-sm font-semibold text-ink-900">{{ auth.user.name }}</p>
        <p class="text-xs uppercase tracking-[0.2em] text-ink-500">{{ roleLabel(auth.user.role) }}</p>
        <p class="mt-3 text-xs text-ink-500">
          Scope kandang: {{ auth.user.coopAccesses.length || 0 }}
        </p>
      </div>
    </div>
  </aside>
</template>
