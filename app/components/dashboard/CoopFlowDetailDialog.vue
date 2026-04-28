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
  currentStockKg?: number | string | null
  summary?: CoopFlowSummary | null
  inDetails?: InFlowDetails
  outDetails?: OutFlowDetails
}>(), {
  loading: false,
  coopName: '-',
  dateLabel: '-',
  currentStockKg: null,
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

function hasPositiveKg(value: string | number | null | undefined) {
  if (value === undefined || value === null || value === '') {
    return false
  }

  return Number(String(value).replace(/,/g, '')) > 0
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

const visibleInDetails = computed(() => ({
  productions: props.inDetails.productions.filter((item) => hasPositiveKg(item.quantityKg)),
  allocationReleases: props.inDetails.allocationReleases.filter((item) => hasPositiveKg(item.allocatedKg)),
  adjustments: props.inDetails.adjustments.filter((item) => hasPositiveKg(item.quantityKg)),
}))

const visibleOutDetails = computed(() => ({
  allocations: props.outDetails.allocations.filter((item) => hasPositiveKg(item.allocatedKg)),
  adjustments: props.outDetails.adjustments.filter((item) => hasPositiveKg(item.quantityKg)),
}))

const hasInDetails = computed(() =>
  visibleInDetails.value.productions.length > 0
  || visibleInDetails.value.allocationReleases.length > 0
  || visibleInDetails.value.adjustments.length > 0,
)

const hasOutDetails = computed(() =>
  visibleOutDetails.value.allocations.length > 0
  || visibleOutDetails.value.adjustments.length > 0,
)
</script>

<template>
  <UiDialog
    :open="props.open"
    :title="`Detail Pergerakan Telur ${props.coopName}`"
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
        class="grid grid-cols-2 gap-1.5 rounded-xl border border-white/70 bg-white/90 p-1.5 sm:grid-cols-4"
      >
        <div class="flex items-center gap-2 rounded-lg bg-emerald-50/50 px-2.5 py-1.5">
          <span class="grid h-7 w-7 place-items-center rounded-full bg-emerald-100/80 text-emerald-700">
            <UiIcon name="arrowDown" class="h-3 w-3" />
          </span>
          <div>
            <p class="text-xs text-ink-600">Total Masuk</p>
            <p class="text-lg font-bold text-emerald-700 sm:text-xl">{{ formatKg(props.summary.totalInKg) }} kg</p>
          </div>
        </div>

        <div class="flex items-center gap-2 rounded-lg bg-brand-50/50 px-2.5 py-1.5">
          <span class="grid h-7 w-7 place-items-center rounded-full bg-brand-100/80 text-brand-700">
            <UiIcon name="arrowUp" class="h-3 w-3" />
          </span>
          <div>
            <p class="text-xs text-ink-600">Total Keluar</p>
            <p class="text-lg font-bold text-brand-700 sm:text-xl">{{ formatKg(props.summary.totalOutKg) }} kg</p>
          </div>
        </div>

        <div class="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5">
          <span class="grid h-7 w-7 place-items-center rounded-full bg-blue-100/80 text-blue-700">
            <UiIcon name="layers" class="h-3 w-3" />
          </span>
          <div>
            <p class="text-xs text-ink-600">Stok Saat Ini</p>
            <p class="text-lg font-bold text-blue-700 sm:text-xl">{{ formatKg(props.currentStockKg ?? 0) }} kg</p>
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
            <p class="text-sm font-semibold text-emerald-700">Telur Masuk</p>
          </div>

          <template v-if="hasInDetails">
          <div v-if="visibleInDetails.productions.length" class="rounded-xl border border-emerald-100/80 bg-white/90 p-2">
            <p class="text-xs font-bold uppercase tracking-wide text-emerald-700">Produksi</p>

            <div class="mt-2 space-y-2">
              <article
                v-for="item in visibleInDetails.productions"
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
          </div>

          <div v-if="visibleInDetails.allocationReleases.length" class="rounded-xl border border-emerald-100/80 bg-white/90 p-2">
            <p class="text-xs font-bold uppercase tracking-wide text-emerald-700">Rilis Alokasi</p>

            <div class="mt-2 space-y-2">
              <article
                v-for="item in visibleInDetails.allocationReleases"
                :key="item.movementId"
                class="rounded-xl border border-emerald-100/80 bg-emerald-50/45"
              >
                <div class="flex items-center justify-between gap-2 border-b border-emerald-100/80 px-2.5 py-1.5">
                  <div>
                    <p class="text-sm font-semibold text-ink-900">{{ item.customerName || '-' }}</p>
                    <p class="text-xs text-ink-500">{{ orderRefLabel(item.orderId) }}</p>
                  </div>
                  <span class="inline-flex items-baseline gap-0.5 rounded-full border border-emerald-100 bg-white px-2 py-0.5 text-emerald-700">
                    <span class="text-sm font-bold leading-none sm:text-base">{{ formatKg(item.allocatedKg) }}</span>
                    <span class="text-[10px] font-semibold">kg</span>
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-1.5 border-b border-emerald-100/80 px-2.5 py-1.5 text-[11px] sm:text-xs">
                  <div class="min-w-0">
                    <p class="text-ink-500">Harga/Kg</p>
                    <p class="truncate font-semibold text-ink-900">{{ priceLabel(item.pricePerKg) }}</p>
                  </div>
                  <div class="min-w-0">
                    <p class="text-ink-500">Total</p>
                    <p class="truncate font-semibold text-emerald-700">{{ priceLabel(item.totalInvoice) }}</p>
                  </div>
                  <div class="min-w-0">
                    <p class="text-ink-500">Qty order</p>
                    <p class="truncate font-semibold text-ink-900">{{ quantityLabel(item.orderQuantityKg) }}</p>
                  </div>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] text-ink-500">
                  <p class="inline-flex items-center gap-1">
                    <UiIcon name="user" class="h-3 w-3" />
                    {{ item.operatorName || '-' }}
                  </p>
                  <p class="inline-flex items-center gap-1">
                    <UiIcon name="calendar" class="h-3 w-3" />
                    Dicatat {{ formatDate(item.createdAt, 'DD MMM YYYY HH:mm') }}
                  </p>
                </div>
              </article>
            </div>
          </div>

          <div v-if="visibleInDetails.adjustments.length" class="rounded-xl border border-emerald-100/80 bg-white/90 p-2">
            <p class="text-xs font-bold uppercase tracking-wide text-emerald-700">Penyesuaian (+)</p>
            <div class="mt-2 space-y-1.5">
              <div
                v-for="item in visibleInDetails.adjustments"
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
          </div>
          </template>

          <div v-else class="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-xs text-ink-500">
            Belum ada detail telur masuk hari ini.
          </div>
        </section>

        <section class="space-y-2 rounded-xl border border-brand-200/70 bg-brand-50/30 p-2">
          <div class="flex items-center gap-1.5">
            <span class="grid h-6 w-6 place-items-center rounded-full bg-brand-100/90 text-brand-700">
              <UiIcon name="arrowUp" class="h-3 w-3" />
            </span>
            <p class="text-sm font-semibold text-brand-700">Telur Keluar</p>
          </div>

          <template v-if="hasOutDetails">
          <div v-if="visibleOutDetails.allocations.length" class="rounded-xl border border-brand-100/80 bg-white/90 p-2">
            <p class="text-xs font-bold uppercase tracking-wide text-brand-700">Alokasi Order</p>

            <div class="mt-2 space-y-2">
              <article
                v-for="item in visibleOutDetails.allocations"
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
                    </div>
                  </div>
                  <span class="inline-flex items-baseline gap-0.5 rounded-full border border-brand-100 bg-white px-2 py-0.5 text-brand-700">
                    <span class="text-sm font-bold leading-none sm:text-base">{{ formatKg(item.allocatedKg) }}</span>
                    <span class="text-[10px] font-semibold">kg</span>
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-1.5 border-b border-brand-100/80 px-2.5 py-1.5 text-[11px] sm:text-xs">
                  <div class="min-w-0">
                    <p class="text-ink-500">Harga/Kg</p>
                    <p class="truncate font-semibold text-ink-900">{{ priceLabel(item.pricePerKg) }}</p>
                  </div>
                  <div class="min-w-0">
                    <p class="text-ink-500">Total</p>
                    <p class="truncate font-semibold text-brand-700">{{ priceLabel(item.totalInvoice) }}</p>
                  </div>
                  <div class="min-w-0">
                    <p class="text-ink-500">Qty order</p>
                    <p class="truncate font-semibold text-ink-900">{{ quantityLabel(item.orderQuantityKg) }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] text-ink-500">
                  <p class="inline-flex items-center gap-1">
                    <UiIcon name="user" class="h-3 w-3" />
                    {{ item.operatorName || '-' }}
                  </p>
                  <p class="inline-flex items-center gap-1">
                    <UiIcon name="calendar" class="h-3 w-3" />
                    Dicatat {{ formatDate(item.createdAt, 'DD MMM YYYY HH:mm') }}
                  </p>
                </div>
              </article>
            </div>
          </div>

          <div v-if="visibleOutDetails.adjustments.length" class="rounded-xl border border-brand-100/80 bg-white/90 p-2">
            <p class="text-xs font-bold uppercase tracking-wide text-brand-700">Penyesuaian (-)</p>
            <div class="mt-2 space-y-1.5">
              <div
                v-for="item in visibleOutDetails.adjustments"
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
          </div>
          </template>

          <div v-else class="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-3 py-2.5 text-xs text-ink-500">
            Belum ada detail telur keluar hari ini.
          </div>
        </section>
      </div>

      <div class="rounded-xl border border-white/70 bg-white/85 px-3 py-2.5 text-xs text-ink-500 sm:text-sm">
        Data pergerakan dapat berubah sesuai transaksi terbaru.
      </div>
    </div>
  </UiDialog>
</template>
