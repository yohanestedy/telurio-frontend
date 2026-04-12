<script setup lang="ts">
import type { AppIconName } from '../../utils/icons'

defineProps<{
  icon: AppIconName
  title: string
  description: string
  alignActionsEnd?: boolean
}>()
</script>

<template>
  <GlassCard>
    <div
      class="flex flex-col gap-3"
      :class="alignActionsEnd ? 'lg:flex-row lg:items-end lg:justify-between' : 'sm:flex-row sm:items-start sm:justify-between'"
    >
      <div class="flex items-start gap-3">
        <div class="surface-outline rounded-2xl p-2.5 text-brand-700">
          <UiIcon :name="icon" class="h-5 w-5" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-ink-900">{{ title }}</h2>
          <p class="mt-1 text-sm text-ink-600">
            {{ description }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </GlassCard>
</template>
