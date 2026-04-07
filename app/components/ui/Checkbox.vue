<script setup lang="ts">
interface Props {
  modelValue?: boolean
  label?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: false,
  label: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <label class="flex items-center gap-3 rounded-2xl border border-white/40 bg-white/60 px-4 py-3">
    <input
      :checked="modelValue"
      type="checkbox"
      class="h-4 w-4 rounded border-white/60 text-brand-600"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    >
    <span class="text-sm text-ink-700">{{ label }}</span>
  </label>
</template>
