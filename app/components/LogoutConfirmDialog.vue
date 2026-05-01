<script setup lang="ts">
interface Props {
  open: boolean
}

defineProps<Props>()
const { t } = useI18n()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()

function close() {
  emit('update:open', false)
}

function confirm() {
  emit('confirm')
}
</script>

<template>
  <UiDialog
    :open="open"
    :title="t('logout.title')"
    :description="t('logout.description')"
    size="md"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-5">
      <div class="rounded-2xl border border-brand-200/80 bg-brand-50/85 px-4 py-3 text-sm text-[#8f4518]">
        {{ t('logout.warning') }}
      </div>

      <div class="flex justify-end gap-2">
        <UiButton variant="ghost" @click="close">{{ t('common.cancel') }}</UiButton>
        <UiButton variant="destructive" icon="logout" @click="confirm">{{ t('logout.confirm') }}</UiButton>
      </div>
    </div>
  </UiDialog>
</template>
