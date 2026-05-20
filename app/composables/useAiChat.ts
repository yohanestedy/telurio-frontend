import { ref, computed, readonly } from 'vue'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AiModel {
  id: string
}

interface ChatStreamPayload {
  type: 'content' | 'tool_call' | 'done' | 'error'
  delta?: string
  name?: string
  message?: string
}

const open = ref(false)
const messages = ref<ChatMessage[]>([])
const streaming = ref(false)
const error = ref<string | null>(null)
const availableModels = ref<AiModel[]>([])
const selectedModel = ref<string>('')
const modelsLoaded = ref(false)
const activeTools = ref<string[]>([])
let activeAbortController: AbortController | null = null

export function useAiChat() {
  const auth = useAuthStore()
  const config = useRuntimeConfig()

  const baseUrl = computed(
    () => `${config.public.apiBaseUrl}${config.public.apiPrefix}`,
  )

  function buildUrl(path: string) {
    return `${baseUrl.value}${path}`
  }

  function buildHeaders(extra: Record<string, string> = {}) {
    const headers: Record<string, string> = { ...extra }
    if (auth.token) {
      headers.Authorization = `Bearer ${auth.token}`
    }
    return headers
  }

  async function loadModels() {
    if (modelsLoaded.value) return
    try {
      const res = await fetch(buildUrl('/ai-chat/models'), {
        headers: buildHeaders(),
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data = (json.data ?? json) as AiModel[]
      availableModels.value = data
      if (!selectedModel.value && data.length > 0) {
        selectedModel.value = data[0]!.id
      }
      modelsLoaded.value = true
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Gagal memuat model'
      error.value = message
    }
  }

  function toggleOpen() {
    open.value = !open.value
    if (open.value && !modelsLoaded.value) {
      void loadModels()
    }
  }

  function setModel(id: string) {
    selectedModel.value = id
  }

  function clearChat() {
    messages.value = []
    error.value = null
    activeTools.value = []
  }

  function resetState() {
    if (activeAbortController) {
      activeAbortController.abort()
      activeAbortController = null
    }
    open.value = false
    messages.value = []
    error.value = null
    activeTools.value = []
    availableModels.value = []
    selectedModel.value = ''
    modelsLoaded.value = false
    streaming.value = false
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || streaming.value) return

    error.value = null
    activeTools.value = []
    messages.value.push({ role: 'user', content: trimmed })
    messages.value.push({ role: 'assistant', content: '' })
    streaming.value = true

    const payloadMessages = messages.value
      .slice(0, -1)
      .map((m) => ({ role: m.role, content: m.content }))

    const controller = new AbortController()
    activeAbortController = controller

    try {
      const response = await fetch(buildUrl('/ai-chat/completions'), {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          model: selectedModel.value,
          messages: payloadMessages,
        }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let nlIndex = buffer.indexOf('\n\n')
        while (nlIndex !== -1) {
          const rawEvent = buffer.slice(0, nlIndex).trim()
          buffer = buffer.slice(nlIndex + 2)
          nlIndex = buffer.indexOf('\n\n')
          if (!rawEvent.startsWith('data:')) continue
          const data = rawEvent.slice(5).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data) as ChatStreamPayload
            handleStreamEvent(parsed)
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (caught) {
      const isAbort =
        (caught instanceof DOMException && caught.name === 'AbortError') ||
        (caught instanceof Error && caught.name === 'AbortError')
      if (isAbort) {
        const last = messages.value[messages.value.length - 1]
        if (last && last.role === 'assistant' && !last.content) {
          last.content = '_(Permintaan dihentikan)_'
        }
      } else {
        const message =
          caught instanceof Error ? caught.message : 'Gagal mengirim pesan'
        error.value = message
        const last = messages.value[messages.value.length - 1]
        if (last && last.role === 'assistant' && !last.content) {
          last.content = `(${message})`
        }
      }
    } finally {
      activeAbortController = null
      streaming.value = false
      activeTools.value = []
    }
  }

  function stopStreaming() {
    if (activeAbortController) {
      activeAbortController.abort()
    }
  }

  function handleStreamEvent(event: ChatStreamPayload) {
    if (event.type === 'content' && event.delta) {
      const last = messages.value[messages.value.length - 1]
      if (last && last.role === 'assistant') {
        last.content += event.delta
      }
    } else if (event.type === 'tool_call' && event.name) {
      activeTools.value.push(event.name)
    } else if (event.type === 'error' && event.message) {
      error.value = event.message
    }
  }

  return {
    open: readonly(open),
    messages: readonly(messages),
    streaming: readonly(streaming),
    error: readonly(error),
    availableModels: readonly(availableModels),
    selectedModel: readonly(selectedModel),
    activeTools: readonly(activeTools),
    toggleOpen,
    setModel,
    clearChat,
    resetState,
    sendMessage,
    stopStreaming,
    loadModels,
  }
}
