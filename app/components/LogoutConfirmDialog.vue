<script setup lang="ts">
interface Props {
  open: boolean
}

defineProps<Props>()

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
    title="Konfirmasi logout"
    description="Anda akan keluar dari sesi saat ini dan perlu login kembali untuk melanjutkan."
    size="md"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-5">
      <div class="rounded-2xl border border-brand-200/80 bg-brand-50/85 px-4 py-3 text-sm text-[#8f4518]">
        Pastikan pekerjaan penting sudah tersimpan sebelum keluar dari aplikasi.
      </div>

      <div class="flex justify-end gap-2">
        <UiButton variant="ghost" @click="close">Batal</UiButton>
        <UiButton variant="destructive" icon="logout" @click="confirm">Ya, logout</UiButton>
      </div>
    </div>
  </UiDialog>
</template>
