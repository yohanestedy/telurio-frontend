import { getMenuByRole } from '../utils/policies'

export function useRoleMenu() {
  const auth = useAuthStore()
  const { t } = useI18n()

  return computed(() => {
    const menu = getMenuByRole(auth.role)

    return {
      desktop: menu.desktop.map((item) => ({
        ...item,
        label: t(`menu.label.${item.label}`),
        description: t(`menu.description.${item.description}`),
      })),
      mobile: menu.mobile.map((item) => ({
        ...item,
        label: t(`menu.label.${item.label}`),
        description: t(`menu.description.${item.description}`),
      })),
    }
  })
}
