<script setup lang="ts">
import type { AppIconName } from '../utils/icons'

interface Props {
  label: string
  value: string
  helper?: string
  icon?: AppIconName
}

withDefaults(defineProps<Props>(), {
  helper: '',
  icon: 'dashboard',
})
</script>

<template>
  <GlassCard :overflow-visible="true">
    <div class="flex items-start justify-between gap-3">
      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700/80">
        {{ label }}
      </p>
      <div class="flex items-center gap-2">
        <slot name="action" />
        <div class="surface-outline rounded-2xl p-2 text-brand-700">
          <UiIcon :name="icon" class="h-4 w-4" />
        </div>
      </div>
    </div>
    <p class="mt-4 text-2xl font-semibold text-ink-900">{{ value }}</p>
    <p v-if="helper" class="mt-2 text-sm text-ink-600">{{ helper }}</p>
  </GlassCard>
</template>
