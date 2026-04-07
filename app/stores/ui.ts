import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarOpen: true,
    orderFilters: {
      lifecycleStatus: '',
      deliveryStatus: '',
      paymentStatus: '',
    },
    calendarView: 'month' as 'month' | 'week' | 'day',
  }),
})
