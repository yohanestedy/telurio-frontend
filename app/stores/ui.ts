import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    sidebarOpen: true,
    orderFilters: {
      sortBy: "deliveryDate",
      order: "asc" as "asc" | "desc",
      lifecycleStatus: "",
      deliveryStatus: "",
      paymentStatus: "",
    },
    calendarView: "month" as "month" | "week" | "day",
  }),
});
