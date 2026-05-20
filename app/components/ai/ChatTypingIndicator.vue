<script setup lang="ts">
defineProps<{
  toolName?: string
}>()
const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-2 text-xs text-ink-500">
    <span class="inline-flex items-center gap-1.5">
      <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
      <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" style="animation-delay: 200ms" />
      <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-300" style="animation-delay: 400ms" />
    </span>
    <span v-if="toolName">{{ t('aiChat.callingTool', { name: toolName }) }}</span>
    <span v-else>{{ t('aiChat.thinking') }}</span>
  </div>
</template>
