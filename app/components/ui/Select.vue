<script setup lang="ts">
interface Option {
  label: string
  value: string
}

interface Props {
  modelValue?: string | null
  label?: string
  error?: string
  placeholder?: string
  options: Option[]
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  error: '',
  placeholder: 'Pilih opsi',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="block space-y-2">
    <span v-if="label" class="text-sm font-medium text-ink-700">{{ label }}</span>
    <select
      :value="modelValue ?? ''"
      class="field-shell"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <span v-if="error" class="text-xs font-medium text-rose-600">{{ error }}</span>
  </label>
</template>
