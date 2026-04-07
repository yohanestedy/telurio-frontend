<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarDay } from '../types/domain'

const props = defineProps<{
  days: CalendarDay[]
}>()

const emit = defineEmits<{
  select: [date: string]
}>()

const events = computed(() =>
  props.days.flatMap((day) => [
    ...day.events.orders.map((item) => ({
      id: item.orderId,
      title: `Order • ${item.customerName}`,
      date: day.date,
      backgroundColor: '#379b79',
      borderColor: '#379b79',
    })),
    ...day.events.productions.map((item) => ({
      id: `${day.date}-${item.coopId}-production`,
      title: `Produksi • ${item.coopName}`,
      date: day.date,
      backgroundColor: '#d97706',
      borderColor: '#d97706',
    })),
    ...day.events.expenses.map((item) => ({
      id: `${day.date}-${item.coopId}-expense`,
      title: `Expense • ${formatRupiah(item.totalAmount)}`,
      date: day.date,
      backgroundColor: '#475569',
      borderColor: '#475569',
    })),
    ...day.events.priceUpdates.map((item, index) => ({
      id: `${day.date}-price-${index}`,
      title: `Harga • ${formatRupiah(item.pricePerKg)}`,
      date: day.date,
      backgroundColor: '#0f766e',
      borderColor: '#0f766e',
    })),
  ]),
)

const options = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    start: 'title',
    center: '',
    end: 'prev,next today',
  },
  events: events.value,
  eventDisplay: 'block',
  height: 'auto',
  dateClick: (arg: { dateStr: string }) => emit('select', arg.dateStr),
}))
</script>

<template>
  <GlassCard>
    <ClientOnly>
      <FullCalendar :options="options" />
    </ClientOnly>
  </GlassCard>
</template>
