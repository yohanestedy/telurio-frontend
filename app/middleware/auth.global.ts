import type { Role } from '../types/domain'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  const isPublic = Boolean(to.meta.public)

  // Public pages should not depend on auth bootstrap/API calls.
  if (isPublic && to.path !== '/login') {
    return
  }

  await auth.bootstrap()

  const roles = (to.meta.roles as Role[] | undefined) ?? []

  if (!auth.isAuthenticated && !isPublic) {
    return navigateTo('/login')
  }

  if (auth.isAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }

  if (roles.length > 0 && auth.user && !roles.includes(auth.user.role)) {
    return navigateTo('/')
  }
})
