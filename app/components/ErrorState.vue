<script setup lang="ts">
interface Props {
  title?: string
  message: string
}

withDefaults(defineProps<Props>(), {
  title: '',
})

const { t } = useI18n()
</script>

<template>
  <GlassCard>
    <div class="rounded-3xl border border-rose-200 bg-rose-50/70 p-5">
      <p class="font-semibold text-rose-700">{{ title || t('error.genericTitle') }}</p>
      <p class="mt-2 text-sm text-rose-600">{{ message }}</p>
      <div class="mt-4">
        <slot />
      </div>
    </div>
  </GlassCard>
</template>
