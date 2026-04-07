<script setup lang="ts">
const { toasts, remove } = useToast()
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-4 z-[60] mx-auto flex max-w-md flex-col gap-3 px-4">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto glass-panel rounded-2xl px-4 py-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-ink-900">{{ toast.title }}</p>
            <p v-if="toast.description" class="mt-1 text-xs text-ink-600">
              {{ toast.description }}
            </p>
          </div>
          <button class="text-xs text-ink-500" @click="remove(toast.id)">Tutup</button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
