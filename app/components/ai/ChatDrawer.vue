<script setup lang="ts">
const {
  open,
  messages,
  streaming,
  error,
  availableModels,
  selectedModel,
  toggleOpen,
  setModel,
  clearChat,
  sendMessage,
} = useAiChat()
const { t } = useI18n()

const inputText = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const textareaEl = ref<HTMLTextAreaElement | null>(null)

const MAX_INPUT_LINES = 15
const LINE_HEIGHT_PX = 20

const STORAGE_KEY = 'telurio.aiChat.drawerWidth'
const MIN_WIDTH = 360
const MAX_WIDTH_RATIO = 0.85
const DEFAULT_WIDTH = 480
const drawerWidth = ref(DEFAULT_WIDTH)
const isResizing = ref(false)

function clampWidth(value: number) {
  if (typeof window === 'undefined') return value
  const max = Math.floor(window.innerWidth * MAX_WIDTH_RATIO)
  return Math.max(MIN_WIDTH, Math.min(max, value))
}

onMounted(() => {
  if (typeof window === 'undefined') return
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const parsed = Number(stored)
    if (!Number.isNaN(parsed)) drawerWidth.value = clampWidth(parsed)
  }
  window.addEventListener('resize', onWindowResize)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('resize', onWindowResize)
  stopResize()
})

function onWindowResize() {
  drawerWidth.value = clampWidth(drawerWidth.value)
}

function startResize(event: MouseEvent) {
  event.preventDefault()
  isResizing.value = true
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', stopResize)
}

function onResizeMove(event: MouseEvent) {
  if (!isResizing.value || typeof window === 'undefined') return
  const next = window.innerWidth - event.clientX
  drawerWidth.value = clampWidth(next)
}

function stopResize() {
  if (!isResizing.value) return
  isResizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', stopResize)
  window.localStorage.setItem(STORAGE_KEY, String(drawerWidth.value))
}

const drawerStyle = computed(() => ({
  width: `${drawerWidth.value}px`,
}))

function autoResizeTextarea() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  const max = MAX_INPUT_LINES * LINE_HEIGHT_PX + 16
  const next = Math.min(el.scrollHeight, max)
  el.style.height = `${next}px`
}

watch(
  () => inputText.value,
  () => {
    nextTick(autoResizeTextarea)
  },
)

const modelOptions = computed(() =>
  availableModels.value.map((m) => ({ label: m.id, value: m.id })),
)

watch(
  messages,
  () => {
    nextTick(() => {
      const el = messagesEl.value
      if (el) el.scrollTop = el.scrollHeight
    })
  },
  { deep: true },
)

watch(open, (value) => {
  if (value) {
    nextTick(() => {
      const el = messagesEl.value
      if (el) el.scrollTop = el.scrollHeight
    })
  }
})

async function submit() {
  const text = inputText.value
  if (!text.trim() || streaming.value) return
  inputText.value = ''
  nextTick(autoResizeTextarea)
  await sendMessage(text)
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void submit()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[60] bg-ink-900/30 backdrop-blur-[2px]"
        @click="toggleOpen"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      leave-active-class="transition-transform duration-200 ease-in"
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="open"
        class="ai-chat-drawer fixed inset-y-0 right-0 z-[65] flex w-full flex-col border-l border-slate-200/70 bg-white/96 backdrop-blur-xl dark:!border-white/10 dark:!bg-[#1a1614]/96"
        :style="drawerStyle"
      >
        <div
          class="absolute inset-y-0 left-0 hidden w-1.5 cursor-ew-resize select-none sm:block"
          :class="isResizing ? 'bg-brand-400/40' : 'hover:bg-brand-300/30'"
          @mousedown="startResize"
        />
        <header class="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3 dark:!border-white/10">
          <div class="flex items-center gap-2.5">
            <div class="rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 p-1.5 text-white">
              <UiIcon name="sparkles" class="h-4 w-4" />
            </div>
            <div>
              <h2 class="text-sm font-bold text-ink-900">{{ t('aiChat.title') }}</h2>
              <p class="text-[11px] text-ink-500">{{ t('aiChat.subtitle') }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-slate-100 disabled:opacity-40"
              :title="t('aiChat.clear')"
              :disabled="messages.length === 0 || streaming"
              @click="clearChat"
            >
              <UiIcon name="refresh" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-slate-100"
              :title="t('common.close')"
              @click="toggleOpen"
            >
              <UiIcon name="close" class="h-4 w-4" />
            </button>
          </div>
        </header>

        <div class="border-b border-slate-200/70 px-4 py-2.5 dark:!border-white/10">
          <label class="block text-[11px] font-medium uppercase tracking-wide text-ink-500">{{ t('aiChat.modelLabel') }}</label>
          <UiSelect
            :model-value="selectedModel"
            :options="modelOptions"
            :searchable="false"
            :placeholder="t('aiChat.modelPlaceholder')"
            class="mt-1"
            @update:model-value="setModel"
          />
        </div>

        <div
          ref="messagesEl"
          class="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        >
          <div v-if="messages.length === 0" class="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-ink-500">
            <div class="rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 p-3 text-brand-600">
              <UiIcon name="sparkles" class="h-6 w-6" />
            </div>
            <p class="font-semibold text-ink-700">{{ t('aiChat.welcomePrompt') }}</p>
            <p class="text-xs text-ink-500">{{ t('aiChat.welcomeHint') }}</p>
          </div>

          <template v-else>
            <AiChatMessage
              v-for="(msg, index) in messages"
              :key="index"
              :role="msg.role"
              :content="msg.content"
              :streaming="streaming && index === messages.length - 1"
            />
          </template>

          <p v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {{ error }}
          </p>
        </div>

        <footer class="border-t border-slate-200/70 px-4 py-3 dark:!border-white/10">
          <div class="flex items-end gap-2">
            <textarea
              ref="textareaEl"
              v-model="inputText"
              :disabled="streaming || !selectedModel"
              :placeholder="t('aiChat.placeholder')"
              rows="1"
              class="field-shell flex-1 resize-none overflow-y-auto !py-2 !text-sm"
              style="min-height: 2.5rem; max-height: 316px;"
              @keydown="onKeyDown"
            />
            <button
              type="button"
              class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm transition hover:from-brand-600 hover:to-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="streaming || !inputText.trim() || !selectedModel"
              :title="t('aiChat.send')"
              @click="submit"
            >
              <UiIcon name="send" class="h-4 w-4" />
            </button>
          </div>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
@media (max-width: 639px) {
  .ai-chat-drawer {
    width: 100% !important;
  }
}
</style>
