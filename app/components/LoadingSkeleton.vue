<script setup lang="ts">
interface Props {
  lines?: number
}

const props = withDefaults(defineProps<Props>(), {
  lines: 4,
})
</script>

<template>
  <GlassCard>
    <div class="space-y-3">
      <div
        v-for="index in props.lines"
        :key="index"
        class="h-4 animate-pulse rounded-full bg-white/70"
      />
    </div>
  </GlassCard>
</template>
