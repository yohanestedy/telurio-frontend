<script setup lang="ts">
interface Props {
  variant?: 'lines' | 'table'
  lines?: number
  rows?: number
  columns?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'lines',
  lines: 4,
  rows: 6,
  columns: 4,
})

const tableColumnsStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Math.max(1, props.columns)}, minmax(0, 1fr))`,
}))
</script>

<template>
  <GlassCard>
    <div v-if="props.variant === 'table'" class="space-y-4">
      <div
        class="grid gap-3"
        :style="tableColumnsStyle"
      >
        <div
          v-for="index in props.columns"
          :key="`head-${index}`"
          :class="[
            index % 3 === 0 ? 'w-10/12' : index % 3 === 1 ? 'w-8/12' : 'w-9/12',
            'h-3 animate-pulse rounded-md bg-slate-200/70',
          ]"
        />
      </div>

      <div class="space-y-3 border-t border-white/40 pt-4">
        <div
          v-for="row in props.rows"
          :key="`row-${row}`"
          class="grid gap-3 py-1"
          :style="tableColumnsStyle"
        >
          <div
            v-for="column in props.columns"
            :key="`cell-${row}-${column}`"
            :class="[
              (row + column) % 3 === 0 ? 'w-11/12' : (row + column) % 3 === 1 ? 'w-9/12' : 'w-10/12',
              'h-4 animate-pulse rounded-md bg-slate-200/70',
            ]"
          />
        </div>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="index in props.lines"
        :key="index"
        :class="[
          index % 3 === 0 ? 'w-full' : index % 3 === 1 ? 'w-11/12' : 'w-9/12',
          'h-4 animate-pulse rounded-md bg-slate-200/70',
        ]"
      />
    </div>
  </GlassCard>
</template>
