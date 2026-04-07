<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  description: '',
})
</script>

<template>
  <GlassCard>
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-ink-900">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-sm text-ink-600">{{ description }}</p>
      </div>
      <slot name="actions" />
    </div>
    <div class="overflow-x-auto">
      <slot />
    </div>
  </GlassCard>
</template>
