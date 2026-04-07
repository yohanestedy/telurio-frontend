<script setup lang="ts">
import { cn } from '../../utils/cn'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  block: false,
  disabled: false,
})

const classes = computed(() =>
  cn(
    'inline-flex items-center justify-center rounded-2xl font-medium transition focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-50',
    {
      'w-full': props.block,
      'px-3 py-2 text-sm': props.size === 'sm',
      'px-4 py-2.5 text-sm': props.size === 'md',
      'px-5 py-3 text-base': props.size === 'lg',
      'bg-brand-600 text-white hover:bg-brand-700': props.variant === 'primary',
      'border border-white/50 bg-white/75 text-ink-900 hover:bg-white': props.variant === 'secondary',
      'bg-transparent text-ink-700 hover:bg-white/60': props.variant === 'ghost',
      'bg-rose-600 text-white hover:bg-rose-700': props.variant === 'destructive',
    },
  ),
)
</script>

<template>
  <button :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
