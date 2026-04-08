<script setup lang="ts">
interface Props {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  loading?: boolean
  limitOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  limitOptions: () => [10, 20, 50, 100],
})

const emit = defineEmits<{
  'update:page': [value: number]
  'update:limit': [value: number]
}>()

const safeTotalPages = computed(() => Math.max(props.totalPages, 1))

function previousPage() {
  if (props.loading || !props.hasPrevPage) {
    return
  }

  emit('update:page', props.page - 1)
}

function nextPage() {
  if (props.loading || !props.hasNextPage) {
    return
  }

  emit('update:page', props.page + 1)
}
</script>

<template>
  <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/40 pt-4">
    <p class="text-sm text-ink-500">
      Page {{ page }} of {{ safeTotalPages }} • {{ total }} data
    </p>

    <div class="flex items-center gap-2">
      <UiButton
        size="sm"
        variant="ghost"
        :disabled="loading || !hasPrevPage"
        @click="previousPage"
      >
        Previous
      </UiButton>
      <UiButton
        size="sm"
        variant="ghost"
        :disabled="loading || !hasNextPage"
        @click="nextPage"
      >
        Next
      </UiButton>
    </div>
  </div>
</template>
