import type { Role } from '../types/domain'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  await auth.bootstrap()

  const isPublic = Boolean(to.meta.public)
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
