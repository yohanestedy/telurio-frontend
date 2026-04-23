import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
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
    requireUnauthorizedLogout(message?: string) {
      this.unauthorizedDialog.open = true;
      this.unauthorizedDialog.title = "Sesi tidak valid";
      this.unauthorizedDialog.message =
        message && message.trim() && message !== "Unauthorized"
          ? message
          : "Sesi Anda sudah tidak berlaku. Untuk melanjutkan, silakan logout lalu masuk kembali.";
    },
    closeUnauthorizedDialog() {
      this.unauthorizedDialog.open = false;
    },
  },
});
