<script setup lang="ts">
import { cn } from '../../utils/cn'
import type { AppIconName } from '../../utils/icons'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  disabled?: boolean
  icon?: AppIconName
  trailingIcon?: AppIconName
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
      'gap-2 px-3 py-2 text-sm': props.size === 'sm',
      'gap-2 px-4 py-2.5 text-sm': props.size === 'md',
      'gap-2.5 px-5 py-3 text-base': props.size === 'lg',
      'border border-brand-700/80 bg-gradient-to-b from-brand-400 via-brand-500 to-brand-700 text-white shadow-[0_12px_28px_rgba(243,95,16,0.24)] hover:brightness-105': props.variant === 'primary',
      'border border-orange-200/70 bg-[#3a271c] text-white shadow-[0_12px_28px_rgba(58,39,28,0.18)] hover:bg-[#2f2018]': props.variant === 'secondary',
      'border border-orange-100/80 bg-white/82 text-ink-800 hover:bg-orange-50/70': props.variant === 'ghost',
      'border border-rose-700/80 bg-gradient-to-b from-rose-500 to-rose-700 text-white shadow-[0_10px_24px_rgba(190,24,93,0.18)] hover:brightness-105': props.variant === 'destructive',
    },
  ),
)
</script>

<template>
  <button :type="type" :disabled="disabled" :class="classes">
    <UiIcon v-if="icon" :name="icon" class="h-4 w-4" />
    <slot />
    <UiIcon v-if="trailingIcon" :name="trailingIcon" class="h-4 w-4" />
  </button>
</template>
