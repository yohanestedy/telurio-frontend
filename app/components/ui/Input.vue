<script setup lang="ts">
interface Props {
  modelValue?: string | number | null
  label?: string
  placeholder?: string
  type?: string
  error?: string
  help?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  type: 'text',
  error: '',
  help: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="block space-y-2">
    <span v-if="label" class="text-sm font-medium text-ink-700">{{ label }}</span>
    <input
      :value="modelValue ?? ''"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      class="field-shell"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <span v-if="error" class="text-xs font-medium text-rose-600">{{ error }}</span>
    <span v-else-if="help" class="text-xs text-ink-500">{{ help }}</span>
  </label>
</template>
