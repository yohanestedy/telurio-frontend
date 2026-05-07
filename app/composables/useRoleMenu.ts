import { getMenuByRole } from "../utils/policies";
import type { MenuItem } from "../types/domain";

export function useRoleMenu() {
  const auth = useAuthStore();
  const { t } = useI18n();

  function translateItem(item: MenuItem): MenuItem {
    return {
      ...item,
      label: t(`menu.label.${item.label}`),
      description: t(`menu.description.${item.description}`),
      ...(item.children?.length
        ? { children: item.children.map(translateItem) }
        : {}),
    };
  }

  return computed(() => {
    const menu = getMenuByRole(auth.role);

    return {
      desktop: menu.desktop.map(translateItem),
      mobile: menu.mobile.map(translateItem),
    };
  });
}
