import { defineStore } from "pinia";
import type { LoginResponse, Role, UserProfile } from "../types/domain";

export const useAuthStore = defineStore("auth", () => {
  const tokenCookie = useCookie<string | null>("telurio_token", {
    default: () => null,
  });

  const token = ref(tokenCookie.value ?? "");
  const user = ref<UserProfile | null>(null);
  const initialized = ref(false);
  const loading = ref(false);

  const isAuthenticated = computed(() => Boolean(token.value && user.value));
  const role = computed<Role | undefined>(() => user.value?.role);

  function syncTokenFromCookie() {
    token.value = tokenCookie.value ?? "";
  }

  function setSession(payload: LoginResponse) {
    token.value = payload.token;
    user.value = payload.user;
    tokenCookie.value = payload.token;
    initialized.value = true;
  }

  function clearSession() {
    token.value = "";
    user.value = null;
    initialized.value = true;
    tokenCookie.value = null;
  }

  async function bootstrap() {
    if (initialized.value) {
      return;
    }

    syncTokenFromCookie();

    if (!token.value) {
      initialized.value = true;
      return;
    }

    loading.value = true;
    try {
      const api = useApi();
      user.value = await api.get<UserProfile>("/auth/me");
    } catch (caught) {
      const api = useApi();
      const mapped = api.mapError(caught);

      if (mapped.status !== 401) {
        clearSession();
      }
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  }

  return {
    token,
    user,
    initialized,
    loading,
    isAuthenticated,
    role,
    syncTokenFromCookie,
    setSession,
    clearSession,
    bootstrap,
  };
});
