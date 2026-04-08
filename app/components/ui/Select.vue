<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

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
  searchable?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  error: '',
  placeholder: 'Pilih opsi',
  searchable: true,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const search = ref('')

const normalizedValue = computed(() => props.modelValue ?? '')
const selectedOption = computed(() => props.options.find((option) => option.value === normalizedValue.value))

const filteredOptions = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) {
    return props.options
  }

  return props.options.filter((option) => option.label.toLowerCase().includes(keyword))
})

function close() {
  open.value = false
  search.value = ''
}

function toggleOpen() {
  if (props.disabled) {
    return
  }

  open.value = !open.value
  if (open.value) {
    search.value = ''
  }
}

function selectOption(value: string) {
  emit('update:modelValue', value)
  close()
}

onClickOutside(rootRef, () => {
  close()
})
</script>

<template>
  <label class="block space-y-2">
    <span v-if="label" class="text-sm font-medium text-ink-700">{{ label }}</span>
    <div
      v-if="searchable"
      ref="rootRef"
      class="relative"
    >
      <button
        type="button"
        class="field-shell flex items-center justify-between gap-3 text-left"
        :class="{ 'cursor-not-allowed opacity-70': disabled }"
        :disabled="disabled"
        @click="toggleOpen"
      >
        <span :class="selectedOption ? 'text-ink-900' : 'text-ink-400'" class="truncate">
          {{ selectedOption?.label || placeholder }}
        </span>
        <UiIcon
          name="chevronDown"
          class="h-4 w-4 text-ink-500 transition-transform"
          :class="{ 'rotate-180': open }"
        />
      </button>

      <div
        v-if="open"
        class="surface-outline absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl shadow-lg"
      >
        <div class="border-b border-slate-200 p-2">
          <div class="relative">
            <UiIcon name="search" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              v-model="search"
              type="text"
              class="field-shell py-2 pl-9"
              placeholder="Cari opsi"
              @keydown.esc.prevent="close"
            >
          </div>
        </div>

        <div class="max-h-56 overflow-y-auto p-1">
          <button
            type="button"
            class="w-full rounded-xl px-3 py-2 text-left text-sm text-ink-600 transition hover:bg-brand-50"
            @click="selectOption('')"
          >
            {{ placeholder }}
          </button>
          <button
            v-for="option in filteredOptions"
            :key="option.value"
            type="button"
            class="w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-brand-50"
            :class="option.value === normalizedValue ? 'bg-brand-100/60 text-ink-900' : 'text-ink-700'"
            @click="selectOption(option.value)"
          >
            {{ option.label }}
          </button>
          <p v-if="filteredOptions.length === 0" class="px-3 py-3 text-sm text-ink-500">
            Opsi tidak ditemukan.
          </p>
        </div>
      </div>
    </div>
    <select
      v-else
      :value="normalizedValue"
      class="field-shell"
      :disabled="disabled"
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
