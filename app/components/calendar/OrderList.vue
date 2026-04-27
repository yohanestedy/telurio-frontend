<script setup lang="ts">
import type { CalendarOrder, CalendarOrderAction } from '../../types/calendar-orders'

const props = withDefaults(defineProps<{
  orders: CalendarOrder[]
  actionSubmittingOrderId?: string
  emptyMessage?: string
  dense?: boolean
  orderActions: (order: CalendarOrder) => CalendarOrderAction[]
}>(), {
  actionSubmittingOrderId: '',
  emptyMessage: 'Tidak ada order di tanggal ini.',
  dense: false,
})

const emit = defineEmits<{
  action: [order: CalendarOrder, action: CalendarOrderAction]
}>()

const deliveryPriority: Record<CalendarOrder['deliveryStatus'], number> = {
  BELUM_DIHANTAR: 0,
  SEDANG_DIHANTAR: 1,
  SUDAH_DIHANTAR: 4,
}

const paymentPriority: Record<CalendarOrder['paymentStatus'], number> = {
  BELUM_BAYAR: 2,
  DP: 3,
  LUNAS: 4,
}

const sortedOrders = computed(() =>
  [...props.orders].sort((left, right) => {
    const leftPrimary = Math.min(
      deliveryPriority[left.deliveryStatus] ?? 99,
      paymentPriority[left.paymentStatus] ?? 99,
    )
    const rightPrimary = Math.min(
      deliveryPriority[right.deliveryStatus] ?? 99,
      paymentPriority[right.paymentStatus] ?? 99,
    )

    if (leftPrimary !== rightPrimary) {
      return leftPrimary - rightPrimary
    }

    const leftDelivery = deliveryPriority[left.deliveryStatus] ?? 99
    const rightDelivery = deliveryPriority[right.deliveryStatus] ?? 99
    if (leftDelivery !== rightDelivery) {
      return leftDelivery - rightDelivery
    }

    const leftPayment = paymentPriority[left.paymentStatus] ?? 99
    const rightPayment = paymentPriority[right.paymentStatus] ?? 99
    if (leftPayment !== rightPayment) {
      return leftPayment - rightPayment
    }

    return left.customerName.localeCompare(right.customerName)
  }),
)

function orderPriceLabel(pricePerKg: string | null) {
  return pricePerKg ? formatRupiah(pricePerKg) : 'Belum dikunci'
}

function orderInvoiceLabel(totalInvoice: string | null) {
  return totalInvoice ? formatRupiah(totalInvoice) : 'Invoice belum dihitung'
}

function isCompletedDelivery(order: CalendarOrder) {
  return order.deliveryStatus === 'SUDAH_DIHANTAR'
}

function deliveryAccentClass(order: CalendarOrder) {
  if (order.deliveryStatus === 'SUDAH_DIHANTAR') {
    return 'bg-[linear-gradient(90deg,#10B981,#34D399)]'
  }

  if (order.deliveryStatus === 'SEDANG_DIHANTAR') {
    return 'bg-[linear-gradient(90deg,#3B82F6,#60A5FA)]'
  }

  return 'bg-[linear-gradient(90deg,#F59E0B,#FCD34D)]'
}
</script>

<template>
  <TransitionGroup
    v-if="sortedOrders.length"
    name="order-stagger"
    tag="div"
    :class="props.dense ? 'space-y-2.5 p-2.5 sm:p-3' : 'space-y-3 p-3 sm:p-4'"
  >
    <article
      v-for="(order, index) in sortedOrders"
      :key="order.orderId"
      class="order-action-card overflow-hidden rounded-2xl border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,249,243,0.94))] shadow-[0_14px_26px_rgba(15,23,42,0.07)]"
      :style="{ '--order-delay': `${index * 45}ms` }"
    >
      <div :class="[props.dense ? 'h-1' : 'h-1.5', deliveryAccentClass(order)]" />

      <div :class="props.dense ? 'p-3' : 'p-3.5 sm:p-4'">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-extrabold tracking-normal text-ink-900 sm:text-base">
              {{ order.customerName }}
            </p>
          </div>

          <StatusChip compact kind="delivery" :value="order.deliveryStatus" />
        </div>

        <div :class="[
          'rounded-2xl border border-white/80 bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]',
          props.dense ? 'mt-2.5 px-2.5 py-2.5' : 'mt-3 px-3 py-3',
        ]">
          <div class="grid grid-cols-3 gap-2">
            <div class="text-center">
              <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                Jumlah
              </p>
              <div class="mt-1 flex items-end justify-center gap-1">
                <span :class="[
                  'font-black leading-none tracking-normal text-brand-700',
                  props.dense ? 'text-base sm:text-lg' : 'text-lg sm:text-xl',
                ]">
                  {{ formatKg(order.quantityKg) }}
                </span>
                <span class="pb-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-500">
                  kg
                </span>
              </div>
            </div>

            <div class="min-w-0 text-center">
              <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                Harga/Kg
              </p>
              <p class="mt-1 truncate text-[11px] font-semibold leading-tight text-ink-800 sm:text-[13px]">
                {{ orderPriceLabel(order.pricePerKg) }}
              </p>
            </div>

            <div class="min-w-0 text-center">
              <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                Total
              </p>
              <p class="mt-1 truncate text-[11px] font-black leading-tight text-brand-700 sm:text-[13px]">
                {{ orderInvoiceLabel(order.totalInvoice) }}
              </p>
            </div>
          </div>
        </div>

        <div :class="props.dense ? 'mt-2.5 flex items-center gap-2' : 'mt-3 flex items-center gap-2'">
          <span class="text-[11px] font-medium text-ink-500">Pembayaran:</span>
          <StatusChip compact kind="payment" :value="order.paymentStatus" />
        </div>

        <div :class="props.dense ? 'my-2.5 h-px bg-slate-200/80' : 'my-3 h-px bg-slate-200/80'" />

        <div class="flex flex-wrap gap-2">
          <div
            v-if="isCompletedDelivery(order)"
            class="flex min-w-[130px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700"
          >
            <span>✓</span>
            <span>Terhantar</span>
          </div>

          <UiButton
            v-for="action in props.orderActions(order)"
            :key="`${order.orderId}-${action.id}`"
            :variant="action.variant"
            size="sm"
            :icon="action.icon"
            :class="[
              'text-[11px] transition-transform duration-150 active:scale-[0.97] sm:text-xs',
              action.prominent
                ? 'basis-full min-w-[140px] flex-1 sm:basis-auto'
                : '',
              action.iconOnly
                ? '!h-8 !w-8 !rounded-xl !px-0 !py-0'
                : '',
            ]"
            :disabled="props.actionSubmittingOrderId === order.orderId"
            :aria-label="action.label"
            :title="action.label"
            @click="emit('action', order, action)"
          >
            <span v-if="!action.iconOnly">{{ action.label }}</span>
            <span v-else class="sr-only">{{ action.label }}</span>
          </UiButton>
        </div>
      </div>
    </article>
  </TransitionGroup>

  <p v-else :class="props.dense ? 'p-3 text-xs text-ink-500' : 'p-4 text-sm text-ink-500 sm:p-5'">
    {{ props.emptyMessage }}
  </p>
</template>

<style scoped>
.order-action-card {
  transform: translateZ(0);
  transition: transform 0.18s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.order-action-card:active {
  transform: scale(0.988);
}

.order-stagger-enter-active,
.order-stagger-leave-active {
  transition:
    opacity 0.32s ease,
    transform 0.32s ease;
  transition-delay: var(--order-delay, 0ms);
}

.order-stagger-enter-from,
.order-stagger-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.985);
}
</style>
