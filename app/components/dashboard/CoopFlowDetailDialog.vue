<script setup lang="ts">
import type { AppIconName } from '../../utils/icons'

interface CoopFlowSummary {
  productionInKg: number
  allocationReleaseInKg: number
  adjustmentInKg: number
  allocationOutKg: number
  adjustmentOutKg: number
  totalInKg: number
  totalOutKg: number
  netFlowKg: number
}

interface ProductionFlowDetail {
  movementId: string
  quantityKg: string
  goodCount: number | null
  collectionTime: string | null
  operatorName: string | null
  createdAt: string
  notes: string | null
}

interface AllocationFlowDetail {
  movementId: string
  orderId: string | null
  customerName: string | null
  deliveryDate: string | null
  allocatedKg: string
  orderQuantityKg: string | null
  pricePerKg: string | null
  totalInvoice: string | null
  operatorName: string | null
  createdAt: string
}

interface AdjustmentFlowDetail {
  movementId: string
  movementType: string
  movementTypeLabel: string
  quantityKg: string
  notes: string | null
  operatorName: string | null
  createdAt: string
}

interface InFlowDetails {
  productions: ProductionFlowDetail[]
  allocationReleases: AllocationFlowDetail[]
  adjustments: AdjustmentFlowDetail[]
}

interface OutFlowDetails {
  allocations: AllocationFlowDetail[]
  adjustments: AdjustmentFlowDetail[]
}

const props = withDefaults(defineProps<{
  open: boolean
  loading?: boolean
  coopName?: string
  dateLabel?: string
  summary?: CoopFlowSummary | null
  inDetails?: InFlowDetails
  outDetails?: OutFlowDetails
}>(), {
  loading: false,
  coopName: '-',
  dateLabel: '-',
  summary: null,
  inDetails: () => ({
    productions: [],
    allocationReleases: [],
    adjustments: [],
  }),
  outDetails: () => ({
    allocations: [],
    adjustments: [],
  }),
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function priceLabel(value: string | null) {
  if (!value) {
    return '-'
  }

  return formatRupiah(value)
}

function quantityLabel(value: string | null) {
  if (!value) {
    return '-'
  }

  return `${formatKg(value)} kg`
}

function formatSignedKg(value: number) {
  const normalized = Number(value.toFixed(3))
  if (normalized === 0) {
    return '0'
  }

  const prefix = normalized > 0 ? '+' : '-'
  return `${prefix}${formatKg(Math.abs(normalized))}`
}

function timeLabel(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function orderRefLabel(orderId: string | null) {
  if (!orderId) {
    return '#-'
  }

  if (orderId.length <= 8) {
    return `#${orderId}`
  }

  return `#${orderId.slice(0, 7)}`
}

function netFlowToneClass(value: number) {
  if (value > 0) {
    return 'text-emerald-700'
  }

  if (value < 0) {
    return 'text-rose-700'
  }

  return 'text-ink-700'
}

function netFlowIcon(value: number): AppIconName {
  if (value > 0) {
    return 'arrowUp'
  }

  if (value < 0) {
    return 'arrowDown'
  }

  return 'minus'
}
</script>

<template>
  <UiDialog
    :open="props.open"
    :title="`Detail Alur ${props.coopName}`"
    :description="''"
    size="lg"
    @update:open="emit('update:open', $event)"
  >
    <LoadingSkeleton v-if="props.loading" :lines="8" />

    <div v-else class="space-y-3">
      <div class="inline-flex items-center gap-1.5 text-xs text-ink-500 sm:text-sm">
        <UiIcon name="calendar" class="h-3.5 w-3.5" />
        <span>{{ props.dateLabel }}</span>
      </div>

      <div
        v-if="props.summary"
        class="grid gap-1.5 rounded-xl border border-white/70 bg-white/90 p-1.5 sm:grid-cols-3"
      >
        <div class="flex items-center gap-2 rounded-lg bg-emerald-50/50 px-2.5 py-1.5 sm:border-r sm:border-emerald-100/70">
          <span class="grid h-7 w-7 place-items-center rounded-full bg-emerald-100/80 text-emerald-700">
            <UiIcon name="arrowDown" class="h-3 w-3" />
          </span>
          <div>
            <p class="text-xs text-ink-600">Total Masuk</p>
            <p class="text-lg font-bold text-emerald-700 sm:text-xl">{{ formatKg(props.summary.totalInKg) }} kg</p>
          </div>
        </div>

        <div class="flex items-center gap-2 rounded-lg bg-brand-50/50 px-2.5 py-1.5 sm:border-r sm:border-brand-100/70">
          <span class="grid h-7 w-7 place-items-center rounded-full bg-brand-100/80 text-brand-700">
            <UiIcon name="delivery" class="h-3 w-3" />
          </span>
          <div>
            <p class="text-xs text-ink-600">Total Keluar</p>
            <p class="text-lg font-bold text-brand-700 sm:text-xl">{{ formatKg(props.summary.totalOutKg) }} kg</p>
          </div>
        </div>

        <div class="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5">
          <span class="grid h-7 w-7 place-items-center rounded-full bg-ink-100/80 text-ink-700">
            <UiIcon :name="netFlowIcon(props.summary.netFlowKg)" class="h-3 w-3" />
          </span>
          <div>
            <p class="text-xs text-ink-600">Net Pergerakan</p>
            <p class="text-lg font-bold sm:text-xl" :class="netFlowToneClass(props.summary.netFlowKg)">
              {{ formatSignedKg(props.summary.netFlowKg) }} kg
            </p>
          </div>
        </div>
      </div>

      <div class="grid gap-2.5 2xl:grid-cols-2">
        <section class="space-y-2 rounded-xl border border-emerald-200/70 bg-emerald-50/35 p-2">
          <div class="flex items-center gap-1.5">
            <span class="grid h-6 w-6 place-items-center rounded-full bg-emerald-100/90 text-emerald-700">
              <UiIcon name="arrowDown" class="h-3 w-3" />
            </span>
            <p class="text-sm font-semibold text-emerald-700">Alur Masuk</p>
          </div>

          <div class="rounded-xl border border-emerald-100/80 bg-white/90 p-2">
            <p class="text-xs font-bold uppercase tracking-wide text-emerald-700">Produksi</p>

            <div v-if="props.inDetails.productions.length" class="mt-2 space-y-2">
              <article
                v-for="item in props.inDetails.productions"
                :key="item.movementId"
                class="rounded-xl border border-emerald-100/80 bg-emerald-50/45"
              >
                <div class="flex items-center justify-between gap-2 border-b border-emerald-100/80 px-2.5 py-1.5">
                  <div class="inline-flex items-center gap-2">
                    <span class="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <UiIcon name="productions" class="h-4 w-4" />
                    </span>
                    <p class="text-xl font-bold tracking-tight text-emerald-700">{{ formatKg(item.quantityKg) }} kg</p>
                  </div>
                  <span class="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-white px-2 py-0.5 text-[11px] text-ink-600">
                    <UiIcon name="clock" class="h-3 w-3" />
                    {{ timeLabel(item.createdAt) }}
                  </span>
                </div>
                <div class="grid gap-1.5 px-2.5 py-1.5 text-xs text-ink-700 sm:grid-cols-3">
                  <p class="inline-flex items-center gap-1.5">
                    <UiIcon name="layers" class="h-3.5 w-3.5 text-emerald-700" />
                    {{ item.goodCount ?? '-' }} butir
                  </p>
                  <p class="inline-flex items-center gap-1.5">
                    <UiIcon name="clock" class="h-3.5 w-3.5 text-emerald-700" />
                    Koleksi: {{ item.collectionTime || '-' }}
                  </p>
                  <p class="inline-flex items-center gap-1.5">
                    <UiIcon name="user" class="h-3.5 w-3.5 text-emerald-700" />
                    {{ item.operatorName || '-' }}
                  </p>
                </div>
              </article>
            </div>

            <div v-else class="mt-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-xs text-ink-500">
              Tidak ada detail produksi.
            </div>
          </div>

          <div class="rounded-xl border border-emerald-100/80 bg-white/90 p-2">
            <p class="text-xs font-bold uppercase tracking-wide text-emerald-700">Rilis Alokasi</p>

            <div v-if="props.inDetails.allocationReleases.length" class="mt-2 space-y-2">
              <article
                v-for="item in props.inDetails.allocationReleases"
                :key="item.movementId"
                class="rounded-xl border border-emerald-100/80 bg-emerald-50/45"
              >
                <div class="flex items-center justify-between gap-2 border-b border-emerald-100/80 px-2.5 py-1.5">
                  <div>
                    <p class="text-sm font-semibold text-ink-900">{{ item.customerName || '-' }}</p>
                    <p class="text-xs text-ink-500">{{ orderRefLabel(item.orderId) }}</p>
                  </div>
                  <span class="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-white px-2 py-0.5 text-[11px] text-ink-600">
                    <UiIcon name="clock" class="h-3 w-3" />
                    {{ timeLabel(item.createdAt) }}
                  </span>
                </div>
                <div class="grid gap-1.5 border-b border-emerald-100/80 px-2.5 py-1.5 text-xs sm:grid-cols-3">
                  <div>
                    <p class="font-semibold text-ink-900">{{ formatKg(item.allocatedKg) }} kg</p>
                    <p class="text-ink-500">@ {{ priceLabel(item.pricePerKg) }}<span v-if="item.pricePerKg">/kg</span></p>
                  </div>
                  <div>
                    <p class="text-ink-500">Total</p>
                    <p class="font-semibold text-emerald-700">{{ priceLabel(item.totalInvoice) }}</p>
                  </div>
                  <div>
                    <p class="text-ink-500">Qty order</p>
                    <p class="font-semibold text-ink-900">{{ quantityLabel(item.orderQuantityKg) }}</p>
                  </div>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] text-ink-500">
                  <p class="inline-flex items-center gap-1">
                    <UiIcon name="user" class="h-3 w-3" />
                    {{ item.operatorName || '-' }}
                  </p>
                  <p class="inline-flex items-center gap-1">
                    <UiIcon name="calendar" class="h-3 w-3" />
                    Dicatat {{ formatDate(item.createdAt) }}
                  </p>
                </div>
              </article>
            </div>

            <div v-else class="mt-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-xs text-ink-500">
              Tidak ada rilis alokasi.
            </div>
          </div>

          <div class="rounded-xl border border-emerald-100/80 bg-white/90 p-2">
            <p class="text-xs font-bold uppercase tracking-wide text-emerald-700">Penyesuaian (+)</p>
            <div v-if="props.inDetails.adjustments.length" class="mt-2 space-y-1.5">
              <div
                v-for="item in props.inDetails.adjustments"
                :key="item.movementId"
                class="rounded-xl border border-emerald-100/80 bg-emerald-50/45 px-2.5 py-1.5 text-xs"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="font-semibold text-ink-900">{{ item.movementTypeLabel }}</p>
                  <p class="font-bold text-emerald-700">+{{ formatKg(item.quantityKg) }} kg</p>
                </div>
                <p class="mt-1 text-xs text-ink-600">Operator: {{ item.operatorName || '-' }} • {{ item.notes || '-' }}</p>
              </div>
            </div>
            <div v-else class="mt-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-xs text-ink-500">
              Tidak ada penyesuaian masuk.
            </div>
          </div>
        </section>

        <section class="space-y-2 rounded-xl border border-brand-200/70 bg-brand-50/30 p-2">
          <div class="flex items-center gap-1.5">
            <span class="grid h-6 w-6 place-items-center rounded-full bg-brand-100/90 text-brand-700">
              <UiIcon name="delivery" class="h-3 w-3" />
            </span>
            <p class="text-sm font-semibold text-brand-700">Alur Keluar</p>
          </div>

          <div class="rounded-xl border border-brand-100/80 bg-white/90 p-2">
            <p class="text-xs font-bold uppercase tracking-wide text-brand-700">Alokasi Order</p>

            <div v-if="props.outDetails.allocations.length" class="mt-2 space-y-2">
              <article
                v-for="item in props.outDetails.allocations"
                :key="item.movementId"
                class="rounded-xl border border-brand-100/80 bg-brand-50/30"
              >
                <div class="flex items-center justify-between gap-2 border-b border-brand-100/80 px-2.5 py-1.5">
                  <div class="inline-flex min-w-0 items-center gap-2">
                    <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                      <UiIcon name="orders" class="h-4 w-4" />
                    </span>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-ink-900">{{ item.customerName || '-' }}</p>
                      <p class="text-xs text-ink-500">{{ orderRefLabel(item.orderId) }}</p>
                    </div>
                  </div>
                  <span class="inline-flex items-center gap-1 rounded-full border border-brand-100 bg-white px-2 py-0.5 text-[11px] text-ink-600">
                    <UiIcon name="clock" class="h-3 w-3" />
                    {{ timeLabel(item.createdAt) }}
                  </span>
                </div>

                <div class="grid gap-1.5 border-b border-brand-100/80 px-2.5 py-1.5 text-xs sm:grid-cols-3">
                  <div>
                    <p class="font-semibold text-ink-900">{{ formatKg(item.allocatedKg) }} kg</p>
                    <p class="text-ink-500">@ {{ priceLabel(item.pricePerKg) }}<span v-if="item.pricePerKg">/kg</span></p>
                  </div>
                  <div>
                    <p class="text-ink-500">Total</p>
                    <p class="font-semibold text-brand-700">{{ priceLabel(item.totalInvoice) }}</p>
                  </div>
                  <div>
                    <p class="text-ink-500">Qty order</p>
                    <p class="font-semibold text-ink-900">{{ quantityLabel(item.orderQuantityKg) }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] text-ink-500">
                  <p class="inline-flex items-center gap-1">
                    <UiIcon name="user" class="h-3 w-3" />
                    {{ item.operatorName || '-' }}
                  </p>
                  <p class="inline-flex items-center gap-1">
                    <UiIcon name="calendar" class="h-3 w-3" />
                    Dicatat {{ formatDate(item.createdAt) }}
                  </p>
                </div>
              </article>
            </div>

            <div v-else class="mt-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-3 py-2.5 text-xs text-ink-500">
              Tidak ada alokasi order.
            </div>
          </div>

          <div class="rounded-xl border border-brand-100/80 bg-white/90 p-2">
            <p class="text-xs font-bold uppercase tracking-wide text-brand-700">Penyesuaian (-)</p>
            <div v-if="props.outDetails.adjustments.length" class="mt-2 space-y-1.5">
              <div
                v-for="item in props.outDetails.adjustments"
                :key="item.movementId"
                class="rounded-xl border border-brand-100/80 bg-brand-50/30 px-2.5 py-1.5 text-xs"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="font-semibold text-ink-900">{{ item.movementTypeLabel }}</p>
                  <p class="font-bold text-brand-700">-{{ formatKg(item.quantityKg) }} kg</p>
                </div>
                <p class="mt-1 text-xs text-ink-600">Operator: {{ item.operatorName || '-' }} • {{ item.notes || '-' }}</p>
              </div>
            </div>
            <div v-else class="mt-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-3 py-2.5 text-xs text-ink-500">
              Tidak ada penyesuaian keluar.
            </div>
          </div>
        </section>
      </div>

      <div class="rounded-xl border border-white/70 bg-white/85 px-3 py-2.5 text-xs text-ink-500 sm:text-sm">
        Data pergerakan dapat berubah sesuai transaksi terbaru.
      </div>
    </div>
  </UiDialog>
</template>
