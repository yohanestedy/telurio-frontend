import { defineStore } from "pinia";

export type AppLanguage = "id" | "en";
export type AppTheme = "light" | "dark";

const LANGUAGE_STORAGE_KEY = "telurio.language";
const THEME_STORAGE_KEY = "telurio.theme";

export const useUiStore = defineStore("ui", {
  state: () => ({
    language: "id" as AppLanguage,
    theme: "light" as AppTheme,
    sidebarOpen: true,
    unauthorizedDialog: {
      open: false,
      title: "Sesi tidak valid",
      message:
        "Sesi Anda sudah tidak berlaku. Untuk melanjutkan, silakan logout lalu masuk kembali.",
    },
    orderFilters: {
      sortBy: "deliveryDate",
      order: "desc" as "asc" | "desc",
      lifecycleStatus: "",
      deliveryStatus: "",
      paymentStatus: "",
      deliveryDate: "",
      startDate: "",
      endDate: "",
    },
    calendarView: "week" as "month" | "week" | "day",
  }),
  actions: {
    initializePreferences() {
      if (typeof window === "undefined") {
        return;
      }

      const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

      if (storedLanguage === "id" || storedLanguage === "en") {
        this.language = storedLanguage;
      }

      if (storedTheme === "light" || storedTheme === "dark") {
        this.theme = storedTheme;
      }

      this.applyTheme();
    },
    setLanguage(language: AppLanguage) {
      this.language = language;

      if (typeof window !== "undefined") {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      }
    },
    toggleLanguage() {
      this.setLanguage(this.language === "id" ? "en" : "id");
    },
    setTheme(theme: AppTheme) {
      this.theme = theme;
      this.applyTheme();

      if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    },
    toggleTheme() {
      this.setTheme(this.theme === "light" ? "dark" : "light");
    },
    applyTheme() {
      if (typeof document === "undefined") {
        return;
      }

      document.documentElement.classList.toggle("dark", this.theme === "dark");
      document.documentElement.style.colorScheme = this.theme;
    },
    requireUnauthorizedLogout(message?: string) {
      this.unauthorizedDialog.open = true;
      this.unauthorizedDialog.title =
        this.language === "en" ? "Invalid session" : "Sesi tidak valid";
      this.unauthorizedDialog.message =
        message && message.trim() && message !== "Unauthorized"
          ? message
          : this.language === "en"
            ? "Your session is no longer valid. To continue, please log out and sign in again."
            : "Sesi Anda sudah tidak berlaku. Untuk melanjutkan, silakan logout lalu masuk kembali.";
    },
    closeUnauthorizedDialog() {
      this.unauthorizedDialog.open = false;
    },
  },
});
