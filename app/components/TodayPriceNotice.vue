<script setup lang="ts">
interface Props {
  title?: string
  message: string
  actionLabel?: string
  showAction?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Harga hari ini belum tersedia',
  actionLabel: 'Tambah harga hari ini',
  showAction: false,
})

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <GlassCard>
    <div class="rounded-3xl border border-amber-200/80 bg-amber-50/85 p-5 shadow-[0_14px_32px_rgba(245,158,11,0.08)]">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex items-start gap-3">
          <div class="rounded-2xl border border-amber-200 bg-white/70 p-2 text-amber-700">
            <UiIcon name="alert" class="h-4 w-4" />
          </div>
          <div>
            <p class="font-semibold text-amber-900">{{ title }}</p>
            <p class="mt-1 text-sm leading-6 text-amber-800/90">{{ message }}</p>
          </div>
        </div>
        <UiButton
          v-if="showAction"
          size="sm"
          icon="plus"
          class="shrink-0"
          @click="emit('action')"
        >
          {{ actionLabel }}
        </UiButton>
      </div>
    </div>
  </GlassCard>
</template>
