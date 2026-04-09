<script setup lang="ts">
interface Props {
  page: number
  limit: number
  all?: boolean
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
  'update:all': [value: boolean]
}>()

const SHOW_ALL_VALUE = '__all__'

const safeTotalPages = computed(() => Math.max(props.totalPages, 1))
const selectedLimit = computed(() =>
  props.all ? SHOW_ALL_VALUE : String(props.limit),
)
const limitSelectOptions = computed(() =>
  [
    ...props.limitOptions.map((value) => ({
      label: `${value} / page`,
      value: String(value),
    })),
    {
      label: 'Show All',
      value: SHOW_ALL_VALUE,
    },
  ],
)

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

function updateLimit(nextLimit: string) {
  if (nextLimit === SHOW_ALL_VALUE) {
    emit('update:all', true)
    return
  }

  const parsed = Number(nextLimit)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return
  }

  emit('update:all', false)
  emit('update:limit', parsed)
}
</script>

<template>
  <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/40 pt-4">
    <p class="text-sm text-ink-500">
      Page {{ page }} of {{ safeTotalPages }} • {{ total }} data
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <div class="w-36">
        <UiSelect
          :model-value="selectedLimit"
          :options="limitSelectOptions"
          placeholder="Per page"
          :searchable="false"
          :disabled="loading"
          @update:model-value="updateLimit"
        />
      </div>
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
