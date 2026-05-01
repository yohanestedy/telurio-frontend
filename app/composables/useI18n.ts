import { translateMessage } from '../utils/i18n'

export function useI18n() {
  const ui = useUiStore()

  function t(key: string, params: Record<string, string | number> = {}) {
    return Object.entries(params).reduce(
      (message, [param, value]) => message.replaceAll(`{${param}}`, String(value)),
      translateMessage(ui.language, key),
    )
  }

  return {
    locale: computed(() => ui.language),
    t,
  }
}
