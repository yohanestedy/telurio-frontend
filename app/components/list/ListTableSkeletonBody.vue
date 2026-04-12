<script setup lang="ts">
type SkeletonCell = {
  tdClass?: string
  lines: Array<{
    class: string
  }>
}

withDefaults(defineProps<{
  rows: number
  rowKeyPrefix: string
  cells: SkeletonCell[]
}>(), {
  rows: 10,
})
</script>

<template>
  <tbody>
    <tr
      v-for="row in rows"
      :key="`${rowKeyPrefix}-${row}`"
      class="border-t border-slate-200/70"
    >
      <td
        v-for="(cell, cellIndex) in cells"
        :key="`${rowKeyPrefix}-${row}-cell-${cellIndex}`"
        class="px-4 py-4"
        :class="cell.tdClass"
      >
        <div
          v-for="(line, lineIndex) in cell.lines"
          :key="`${rowKeyPrefix}-${row}-cell-${cellIndex}-line-${lineIndex}`"
          class="h-4 animate-pulse rounded-md bg-slate-200/70"
          :class="line.class"
        />
      </td>
    </tr>
  </tbody>
</template>
