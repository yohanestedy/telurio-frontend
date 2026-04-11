<script setup lang="ts">
withDefaults(defineProps<{
  overflowVisible?: boolean
}>(), {
  overflowVisible: false,
})
</script>

<template>
  <section
    class="glass-panel relative rounded-[28px] p-5 sm:p-6"
    :class="overflowVisible ? 'overflow-visible' : 'overflow-hidden'"
  >
    <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/70 to-transparent" />
    <slot />
  </section>
</template>
