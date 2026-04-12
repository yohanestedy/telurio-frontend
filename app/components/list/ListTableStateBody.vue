<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    colspan: number
    message: string
    mode: 'empty' | 'error'
    retryLabel?: string
  }>(),
  {
    retryLabel: 'Coba lagi',
  },
)

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <tbody>
    <tr>
      <td
        :colspan="props.colspan"
        class="px-4 py-14 text-center"
        :class="props.mode === 'empty' ? 'text-sm text-ink-500' : ''"
      >
        <template v-if="props.mode === 'error'">
          <p class="text-sm text-rose-700">{{ props.message }}</p>
          <div class="mt-3 flex justify-center">
            <UiButton size="sm" icon="refresh" @click="emit('retry')">
              {{ props.retryLabel }}
            </UiButton>
          </div>
        </template>
        <template v-else>
          {{ props.message }}
        </template>
      </td>
    </tr>
  </tbody>
</template>
