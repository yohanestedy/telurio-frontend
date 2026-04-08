<script setup lang="ts">
import { cn } from '../../utils/cn'

interface Props {
  open: boolean
  title?: string
  description?: string
  size?: 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  size: 'lg',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function close() {
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.open"
      class="fixed inset-0 z-50 overflow-y-auto bg-ink-900/25 p-3 backdrop-blur-sm sm:p-4"
      @click.self="close"
    >
      <div
        :class="
          cn(
            'glass-panel relative mx-auto my-auto w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[28px] p-5 sm:max-h-[calc(100dvh-2rem)] sm:p-6',
            {
              'max-w-2xl': props.size === 'md',
              'max-w-4xl': props.size === 'lg',
              'max-w-5xl': props.size === 'xl',
            },
          )
        "
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-ink-900">{{ title }}</h3>
            <p v-if="description" class="mt-1 text-sm text-ink-600">{{ description }}</p>
          </div>
          <UiButton variant="ghost" size="sm" icon="close" @click="close">Tutup</UiButton>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
