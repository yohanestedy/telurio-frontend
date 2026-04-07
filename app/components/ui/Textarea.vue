<script setup lang="ts">
interface Props {
  modelValue?: string | null
  label?: string
  placeholder?: string
  error?: string
  rows?: number
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  error: '',
  rows: 4,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="block space-y-2">
    <span v-if="label" class="text-sm font-medium text-ink-700">{{ label }}</span>
    <textarea
      :rows="rows"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      class="field-shell resize-none"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <span v-if="error" class="text-xs font-medium text-rose-600">{{ error }}</span>
  </label>
</template>
