import type { Role } from "../types/domain";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const isPublic = Boolean(to.meta.public);
  const isLoginPage = to.path === "/login";

  if (import.meta.server) {
    const refreshCookie = useCookie("telurio_rt");

    if (isLoginPage && refreshCookie.value) {
      return navigateTo(
        from.path && from.path !== "/login" ? from.fullPath : "/",
      );
    }

    if (isPublic) {
      return;
    }

    if (!refreshCookie.value) {
      return navigateTo("/login");
    }

    return;
  }

  const auth = useAuthStore();

  // Public pages should not depend on auth bootstrap/API calls, except login.
  if (isPublic && !isLoginPage) {
    return;
  }

  await auth.bootstrap();

  const roles = (to.meta.roles as Role[] | undefined) ?? [];

  if (!auth.isAuthenticated && !isPublic) {
    return navigateTo("/login");
  }

  if (auth.isAuthenticated && isLoginPage) {
    return navigateTo(
      from.path && from.path !== "/login" ? from.fullPath : "/",
    );
  }

  if (roles.length > 0 && auth.user && !roles.includes(auth.user.role)) {
    return navigateTo("/");
  }
});
