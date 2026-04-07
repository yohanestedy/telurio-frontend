<script setup lang="ts">
import { cn } from '../../utils/cn'

interface Props {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'neutral',
})
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
        {
          'bg-white/70 text-ink-700': props.tone === 'neutral',
          'bg-emerald-100 text-emerald-700': props.tone === 'success',
          'bg-amber-100 text-amber-700': props.tone === 'warning',
          'bg-rose-100 text-rose-700': props.tone === 'danger',
          'bg-sky-100 text-sky-700': props.tone === 'info',
        },
      )
    "
  >
    <slot />
  </span>
</template>
