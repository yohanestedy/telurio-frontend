<script setup lang="ts">
import type { CalendarDay } from '../types/domain'

definePageMeta({
  title: 'Calendar',
  roles: ['ADMIN', 'OWNER', 'OPERATOR'],
})

const api = useApi()
const ui = useUiStore()

const loading = ref(true)
const error = ref('')
const days = ref<CalendarDay[]>([])
const selectedDate = ref(isoDate(new Date()))
const selectedDay = ref<CalendarDay | null>(null)

async function loadCalendar() {
  loading.value = true
  error.value = ''
  try {
    days.value = await api.get<CalendarDay[]>('/calendar', {
      view: ui.calendarView,
    })
    selectedDay.value = days.value.find((item) => item.date === selectedDate.value) ?? null
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function selectDate(date: string) {
  selectedDate.value = date
  try {
    selectedDay.value = await api.get<CalendarDay>(`/calendar/${date}`)
  } catch (caught) {
    error.value = api.mapError(caught).message
  }
}

watch(
  () => ui.calendarView,
  () => {
    loadCalendar()
  },
)

onMounted(loadCalendar)
</script>

<template>
  <div class="space-y-6">
    <FilterBar>
      <UiSelect
        v-model="ui.calendarView"
        :options="[
          { label: 'Month', value: 'month' },
          { label: 'Week', value: 'week' },
          { label: 'Day', value: 'day' },
        ]"
        label="View kalender"
      />
      <template #actions>
        <UiButton variant="secondary" icon="refresh" @click="loadCalendar">Refresh</UiButton>
      </template>
    </FilterBar>

    <LoadingSkeleton v-if="loading" :lines="8" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="loadCalendar">Coba lagi</UiButton>
    </ErrorState>
    <div v-else class="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <CalendarBoard :days="days" @select="selectDate" />
      <TableCard title="Detail Tanggal" :description="selectedDate" icon="calendar">
        <div v-if="selectedDay" class="space-y-4 text-sm text-ink-700">
          <div>
            <p class="font-semibold text-ink-900">Orders</p>
            <div v-if="selectedDay.events.orders.length" class="mt-2 space-y-2">
              <div
                v-for="order in selectedDay.events.orders"
                :key="order.orderId"
                class="rounded-2xl border border-white/40 bg-white/60 p-4"
              >
                <div class="font-medium">{{ order.customerName }}</div>
                <div class="mt-1 text-ink-600">{{ formatKg(order.quantityKg) }} kg</div>
              </div>
            </div>
            <p v-else class="mt-2 text-ink-500">Tidak ada order.</p>
          </div>

          <div>
            <p class="font-semibold text-ink-900">Produksi</p>
            <div v-if="selectedDay.events.productions.length" class="mt-2 space-y-2">
              <div
                v-for="production in selectedDay.events.productions"
                :key="production.coopId"
                class="rounded-2xl border border-white/40 bg-white/60 p-4"
              >
                {{ production.coopName }} • {{ formatKg(production.totalGoodKg) }} kg
              </div>
            </div>
            <p v-else class="mt-2 text-ink-500">Tidak ada produksi.</p>
          </div>

          <div>
            <p class="font-semibold text-ink-900">Pengeluaran</p>
            <div v-if="selectedDay.events.expenses.length" class="mt-2 space-y-2">
              <div
                v-for="expense in selectedDay.events.expenses"
                :key="expense.coopId"
                class="rounded-2xl border border-white/40 bg-white/60 p-4"
              >
                {{ formatRupiah(expense.totalAmount) }}
              </div>
            </div>
            <p v-else class="mt-2 text-ink-500">Tidak ada pengeluaran.</p>
          </div>
        </div>
        <p v-else class="text-sm text-ink-500">Pilih tanggal pada kalender untuk melihat detailnya.</p>
      </TableCard>
    </div>
  </div>
</template>
