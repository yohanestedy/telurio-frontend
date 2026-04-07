import { defineStore } from 'pinia'
import type { LoginResponse, Role, UserProfile } from '../types/domain'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    user: null as UserProfile | null,
    initialized: false,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
    role: (state): Role | undefined => state.user?.role,
  },
  actions: {
    syncTokenFromCookie() {
      const tokenCookie = useCookie<string | null>('telurio_token', {
        default: () => null,
      })
      this.token = tokenCookie.value ?? ''
    },
    setSession(payload: LoginResponse) {
      this.token = payload.token
      this.user = payload.user
      const tokenCookie = useCookie<string | null>('telurio_token')
      tokenCookie.value = payload.token
    },
    clearSession() {
      this.token = ''
      this.user = null
      this.initialized = true
      const tokenCookie = useCookie<string | null>('telurio_token')
      tokenCookie.value = null
    },
    async bootstrap() {
      if (this.initialized) {
        return
      }

      this.syncTokenFromCookie()

      if (!this.token) {
        this.initialized = true
        return
      }

      this.loading = true
      try {
        const api = useApi()
        this.user = await api.get<UserProfile>('/auth/me')
      } catch {
        this.clearSession()
      } finally {
        this.loading = false
        this.initialized = true
      }
    },
  },
})
