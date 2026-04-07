<script setup lang="ts">
interface Props {
  label: string
  value: string
  helper?: string
}

withDefaults(defineProps<Props>(), {
  helper: '',
})
</script>

<template>
  <GlassCard>
    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700/70">
      {{ label }}
    </p>
    <p class="mt-4 text-2xl font-semibold text-ink-900">{{ value }}</p>
    <p v-if="helper" class="mt-2 text-sm text-ink-600">{{ helper }}</p>
  </GlassCard>
</template>
