<script setup lang="ts">
interface Props {
  title: string
  description: string
}

defineProps<Props>()
</script>

<template>
  <GlassCard>
    <div class="py-10 text-center">
      <p class="text-lg font-semibold text-ink-900">{{ title }}</p>
      <p class="mt-2 text-sm text-ink-600">{{ description }}</p>
      <div class="mt-5">
        <slot />
      </div>
    </div>
  </GlassCard>
</template>
