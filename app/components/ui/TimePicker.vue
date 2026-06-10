<script setup lang="ts">
interface Props {
  modelValue?: string | null
  label?: string
  placeholder?: string
  error?: string
  help?: string
  disabled?: boolean
  step?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  placeholder: '--:--',
  error: '',
  help: '',
  disabled: false,
  step: 60,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="block space-y-2">
    <span v-if="label" class="text-sm font-medium text-ink-700">{{ label }}</span>
    <div class="field-shell relative flex items-center justify-between gap-3 py-3">
      <span :class="modelValue ? 'text-ink-900' : 'text-ink-400'" class="truncate text-sm">
        {{ modelValue || placeholder }}
      </span>
      <span class="flex items-center gap-1">
        <button
          v-if="modelValue"
          type="button"
          class="flex h-5 w-5 items-center justify-center rounded-full text-ink-400 transition hover:bg-slate-200 hover:text-ink-700"
          @click.stop="emit('update:modelValue', '')"
          :aria-label="'Hapus waktu'"
        >
          <UiIcon name="close" class="h-3.5 w-3.5" />
        </button>
        <UiIcon name="clock" class="h-4 w-4 shrink-0 text-ink-500" />
      </span>
      <input
        :value="modelValue ?? ''"
        type="time"
        :step="step"
        :disabled="disabled"
        class="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
    </div>
    <span v-if="error" class="text-xs font-medium text-rose-600">{{ error }}</span>
    <span v-else-if="help" class="text-xs text-ink-500">{{ help }}</span>
  </label>
</template>
