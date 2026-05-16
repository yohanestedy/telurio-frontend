import { defineStore } from "pinia";
import type { LoginResponse, Role, UserProfile } from "../types/domain";
import type { ApiSuccessResponse } from "../types/api";

function buildAuthPath(path: string) {
  const config = useRuntimeConfig();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${config.public.apiBaseUrl}${config.public.apiPrefix}${normalizedPath}`;
}

function unwrapResponse<T>(response: T | ApiSuccessResponse<T>): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in (response as Record<string, unknown>)
  ) {
    return (response as ApiSuccessResponse<T>).data;
  }

  return response as T;
}

function extractAccessToken(payload: Partial<LoginResponse>) {
  return payload.accessToken ?? payload.token ?? "";
}

function getServerCookieHeaders() {
  if (import.meta.server) {
    return useRequestHeaders(["cookie"]);
  }

  return undefined;
}

export const useAuthStore = defineStore("auth", () => {
  const roleHint = useCookie<Role | null>("telurio_role_hint", {
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 14,
  });
  const token = ref("");
  const user = ref<UserProfile | null>(null);
  const initialized = ref(false);
  const loading = ref(false);
  const refreshPromise = ref<Promise<string | null> | null>(null);

  const isAuthenticated = computed(() => Boolean(token.value && user.value));
  const role = computed<Role | undefined>(
    () => user.value?.role ?? roleHint.value ?? undefined,
  );

  function setAccessToken(accessToken: string) {
    token.value = accessToken;
  }

  function setUser(profile: UserProfile | null) {
    user.value = profile;
    if (profile) {
      roleHint.value = profile.role;
    }
  }

  function setSession(payload: LoginResponse) {
    setAccessToken(extractAccessToken(payload));
    setUser(payload.user);
    initialized.value = true;
  }

  function clearSession() {
    token.value = "";
    user.value = null;
    roleHint.value = null;
    initialized.value = true;
  }

  async function refreshSession() {
    if (refreshPromise.value) {
      return refreshPromise.value;
    }

    refreshPromise.value = $fetch<
      LoginResponse | ApiSuccessResponse<LoginResponse>
    >(buildAuthPath("/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: getServerCookieHeaders(),
    })
      .then((response) => {
        const payload = unwrapResponse(response);
        const accessToken = extractAccessToken(payload);
        if (!accessToken) {
          throw new Error("Refresh response missing access token");
        }
        setAccessToken(accessToken);
        return accessToken;
      })
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise.value = null;
      });

    return refreshPromise.value;
  }

  async function fetchMe() {
    if (!token.value) {
      user.value = null;
      return null;
    }

    const response = await $fetch<
      UserProfile | ApiSuccessResponse<UserProfile>
    >(buildAuthPath("/auth/me"), {
      method: "GET",
      credentials: "include",
      headers: {
        ...getServerCookieHeaders(),
        Authorization: `Bearer ${token.value}`,
      },
    });

    const profile = unwrapResponse(response);
    setUser(profile);
    return profile;
  }

  async function bootstrap() {
    if (initialized.value) {
      return;
    }

    loading.value = true;
    try {
      if (!token.value) {
        await refreshSession();
      }

      if (token.value) {
        await fetchMe();
      }
    } catch {
      clearSession();
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  async function logout() {
    try {
      await $fetch(buildAuthPath("/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearSession();
    }
  }

  async function logoutAll() {
    try {
      await $fetch(buildAuthPath("/auth/logout-all"), {
        method: "POST",
        credentials: "include",
        headers: token.value
          ? {
              Authorization: `Bearer ${token.value}`,
            }
          : undefined,
      });
    } finally {
      clearSession();
    }
  }

  return {
    token,
    user,
    initialized,
    loading,
    isAuthenticated,
    role,
    setAccessToken,
    setUser,
    setSession,
    clearSession,
    refreshSession,
    fetchMe,
    bootstrap,
    logout,
    logoutAll,
  };
});
