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
  required?: boolean
  prefix?: string
  thousandSeparator?: boolean
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
  required: false,
  prefix: undefined,
  thousandSeparator: false,
  preventScrollOnNumber: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const resolvedType = computed(() => (props.thousandSeparator ? 'text' : props.type))
const resolvedInputmode = computed(() =>
  props.thousandSeparator ? 'numeric' : props.inputmode,
)

const displayValue = computed(() => {
  const raw = props.modelValue ?? ''
  if (!props.thousandSeparator) {
    return raw
  }

  const digits = String(raw).replace(/\D/g, '')
  return digits ? Number(digits).toLocaleString('id-ID') : ''
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement

  if (props.thousandSeparator) {
    const digits = target.value.replace(/\D/g, '')
    emit('update:modelValue', digits)
    target.value = digits ? Number(digits).toLocaleString('id-ID') : ''
    return
  }

  emit('update:modelValue', target.value)
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
    <span v-if="label" class="text-sm font-medium text-ink-700">
      {{ label }}
      <span v-if="required" class="text-rose-500" aria-hidden="true">*</span>
    </span>
    <div class="relative">
      <span
        v-if="prefix"
        class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-500"
      >{{ prefix }}</span>
      <input
        :value="displayValue"
        :type="resolvedType"
        :min="min"
        :max="max"
        :step="step"
        :inputmode="resolvedInputmode"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="Boolean(error)"
        class="field-shell"
        :class="prefix ? 'pl-10' : ''"
        @input="handleInput"
        @wheel="handleWheel"
      >
    </div>
    <span v-if="error" data-field-error="true" class="text-xs font-medium text-rose-600">{{ error }}</span>
    <span v-else-if="help" class="text-xs text-ink-500">{{ help }}</span>
  </label>
</template>
