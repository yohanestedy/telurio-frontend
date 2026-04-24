<script setup lang="ts">
interface Props {
  modelValue?: string | number | null
  label?: string
  placeholder?: string
  type?: string
  min?: string | number
  max?: string | number
  step?: string | number
  inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  error?: string
  help?: string
  disabled?: boolean
  preventScrollOnNumber?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  type: 'text',
  min: undefined,
  max: undefined,
  step: undefined,
  inputmode: undefined,
  error: '',
  help: '',
  disabled: false,
  preventScrollOnNumber: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function handleWheel(event: WheelEvent) {
  if (!props.preventScrollOnNumber || props.type !== 'number') {
    return
  }

  if (event.cancelable) {
    event.preventDefault()
  }

  const target = event.target as HTMLInputElement
  if (document.activeElement === target) {
    target.blur()
  }
}
</script>

<template>
  <label class="block space-y-2">
    <span v-if="label" class="text-sm font-medium text-ink-700">{{ label }}</span>
    <input
      :value="modelValue ?? ''"
      :type="type"
      :min="min"
      :max="max"
      :step="step"
      :inputmode="inputmode"
      :placeholder="placeholder"
      :disabled="disabled"
      class="field-shell"
      @input="handleInput"
      @wheel="handleWheel"
    >
    <span v-if="error" class="text-xs font-medium text-rose-600">{{ error }}</span>
    <span v-else-if="help" class="text-xs text-ink-500">{{ help }}</span>
  </label>
</template>
