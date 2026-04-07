import { getMenuByRole } from '../utils/policies'

export function useRoleMenu() {
  const auth = useAuthStore()

  return computed(() => getMenuByRole(auth.role))
}
