<script setup lang="ts">
import { cn } from '../../utils/cn'

interface Props {
  tone?: 'brand' | 'alternative' | 'gray' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'neutral',
})
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
        {
          'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-300':
            props.tone === 'brand' || props.tone === 'info',
          'border-slate-200 bg-white text-ink-800 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-100':
            props.tone === 'alternative' || props.tone === 'neutral',
          'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-400/20 dark:bg-slate-400/15 dark:text-slate-200':
            props.tone === 'gray',
          'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300':
            props.tone === 'success',
          'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300':
            props.tone === 'warning',
          'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-300':
            props.tone === 'danger',
        },
      )
    "
  >
    <slot />
  </span>
</template>
