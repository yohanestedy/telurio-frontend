export interface ToastItem {
  id: string
  title: string
  description?: string
  tone?: 'success' | 'error' | 'info'
}

export function useToast() {
  const toasts = useState<ToastItem[]>('toasts', () => [])

  function push(toast: Omit<ToastItem, 'id'>) {
    const item = {
      ...toast,
      id: crypto.randomUUID(),
    }

    toasts.value = [...toasts.value, item]

    setTimeout(() => {
      toasts.value = toasts.value.filter((entry) => entry.id !== item.id)
    }, 3200)
  }

  return {
    toasts,
    success(title: string, description?: string) {
      push({ title, description, tone: 'success' })
    },
    error(title: string, description?: string) {
      push({ title, description, tone: 'error' })
    },
    info(title: string, description?: string) {
      push({ title, description, tone: 'info' })
    },
    remove(id: string) {
      toasts.value = toasts.value.filter((entry) => entry.id !== id)
    },
  }
}
