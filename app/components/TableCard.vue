<script setup lang="ts">
import type { AppIconName } from '../utils/icons'

interface Props {
  title: string
  description?: string
  icon?: AppIconName
}

withDefaults(defineProps<Props>(), {
  description: '',
  icon: 'package',
})
</script>

<template>
  <GlassCard>
    <div class="mb-4 flex items-start justify-between gap-3">
      <div class="flex items-start gap-3">
        <div class="surface-outline rounded-2xl p-2.5 text-brand-700">
          <UiIcon :name="icon" class="h-5 w-5" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-ink-900">{{ title }}</h2>
          <p v-if="description" class="mt-1 text-sm text-ink-600">{{ description }}</p>
        </div>
      </div>
      <slot name="actions" />
    </div>
    <div class="overflow-x-auto">
      <slot />
    </div>
  </GlassCard>
 </template>
