<script setup lang="ts">
const { open, toggleOpen } = useAiChat()
const auth = useAuthStore()
const { t } = useI18n()

const visible = computed(() => Boolean(auth.user))
</script>

<template>
  <button
    v-if="visible"
    type="button"
    :title="t('aiChat.title')"
    :aria-label="t('aiChat.title')"
    class="group fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-white shadow-[0_18px_38px_rgba(243,95,16,0.32)] transition-transform hover:scale-105 active:scale-95 lg:bottom-8 lg:right-8 lg:h-14 lg:w-14 max-lg:bottom-24"
    :class="open ? 'rotate-45' : ''"
    @click="toggleOpen"
  >
    <UiIcon v-if="!open" name="sparkles" class="h-5 w-5 lg:h-6 lg:w-6" />
    <UiIcon v-else name="close" class="h-4 w-4 -rotate-45 lg:h-5 lg:w-5" />
  </button>
</template>
