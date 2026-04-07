import type { LoginResponse, Permission, Role } from '../types/domain'
import { hasPermission } from '../utils/policies'

export function useAuth() {
  const store = useAuthStore()
  const api = useApi()

  async function login(payload: { username: string; password: string }) {
    const result = await api.post<LoginResponse>('/auth/login', payload, {
      auth: false,
    })
    store.setSession(result)
    return result
  }

  async function logout() {
    store.clearSession()
    await navigateTo('/login')
  }

  async function refreshMe() {
    const me = await api.get('/auth/me')
    store.user = me
    return me
  }

  function can(permission: Permission) {
    return hasPermission(store.role, permission)
  }

  function hasRole(...roles: Role[]) {
    return store.role ? roles.includes(store.role) : false
  }

  return {
    store,
    login,
    logout,
    refreshMe,
    can,
    hasRole,
  }
}
