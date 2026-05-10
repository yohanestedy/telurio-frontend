<script setup lang="ts">
const { toasts, remove } = useToast()
const { t } = useI18n()

const toneIconMap = {
  success: 'circleCheckBig',
  error: 'circleX',
  info: 'info',
  warning: 'circleAlert',
} as const

const toneColorMap = {
  success: {
    icon: 'text-emerald-600',
    badge: 'bg-emerald-100',
    ring: 'ring-emerald-200/80',
  },
  error: {
    icon: 'text-rose-600',
    badge: 'bg-rose-100',
    ring: 'ring-rose-200/80',
  },
  info: {
    icon: 'text-sky-600',
    badge: 'bg-sky-100',
    ring: 'ring-sky-200/80',
  },
  warning: {
    icon: 'text-amber-600',
    badge: 'bg-amber-100',
    ring: 'ring-amber-200/80',
  },
} as const

function resolveTone(tone?: 'success' | 'error' | 'info' | 'warning') {
  return tone ?? 'info'
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-4 z-[100] mx-auto flex max-w-md flex-col gap-3 px-4">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto glass-panel rounded-2xl px-4 py-3 ring-1"
        :class="toneColorMap[resolveTone(toast.tone)].ring"
      >
        <div class="flex justify-between gap-3" :class="toast.description ? 'items-start' : 'items-center'">
          <div class="flex gap-3" :class="toast.description ? 'items-start' : 'items-center'">
            <div
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              :class="[
                toneColorMap[resolveTone(toast.tone)].badge,
                toast.description ? 'mt-0.5' : '',
              ]"
            >
              <UiIcon
                :name="toneIconMap[resolveTone(toast.tone)]"
                class="h-5 w-5"
                :class="toneColorMap[resolveTone(toast.tone)].icon"
              />
            </div>

            <div>
              <p class="text-sm font-semibold text-ink-900">{{ toast.title }}</p>
              <p v-if="toast.description" class="mt-1 text-xs text-ink-600">
                {{ toast.description }}
              </p>
            </div>
          </div>
          <button class="text-xs text-ink-500" @click="remove(toast.id)">{{ t('common.close') }}</button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
