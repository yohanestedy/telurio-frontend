<script setup lang="ts">
interface Props {
  title?: string
  message: string
  actionLabel?: string
  showAction?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Harga telur hari ini belum diinput',
  actionLabel: 'Input harga hari ini',
  showAction: false,
})

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <GlassCard>
    <div class="rounded-3xl border border-brand-200/80 bg-gradient-to-br from-brand-50/95 to-[#fff3e7] p-5 shadow-[0_14px_32px_rgba(243,95,16,0.10)]">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex items-start gap-3">
          <div class="rounded-2xl border border-brand-200 bg-white/78 p-2 text-brand-700">
            <UiIcon name="alert" class="h-4 w-4" />
          </div>
          <div>
            <p class="font-semibold text-brand-900">{{ title }}</p>
            <p class="mt-1 text-sm leading-6 text-[#8f4518]">{{ message }}</p>
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
