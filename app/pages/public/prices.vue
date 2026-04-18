<script setup lang="ts">
interface PublicCurrentPrice {
  effectiveDate: string
  pricePerKg: string | number
  comparison?: {
    trend: 'NAIK' | 'TURUN' | 'TETAP' | 'BELUM_ADA_DATA'
    differencePerKg: string | null
    previousDate: string | null
    previousPricePerKg: string | number | null
  }
}

interface PublicShareText {
  text: string
}

definePageMeta({
  layout: 'public',
  public: true,
  title: 'Referensi Harga Telur Ras Lampung',
})

useSeoMeta({
  title: 'Harga Telur Hari Ini | Telurio',
  description: 'Acuan harga telur ras yang berlaku di masyarakat Lampung. Diperbarui berkala dan mudah dibagikan.',
})

const api = useApi()
const toast = useToast()

const loading = ref(true)
const refreshing = ref(false)
const error = ref('')
const currentPrice = ref<PublicCurrentPrice | null>(null)
const shareText = ref('')
const shareImageVersion = ref(Date.now())

const formattedPrice = computed(() =>
  currentPrice.value ? formatRupiah(currentPrice.value.pricePerKg) : '-',
)

const dateDisplay = computed(() => {
  if (!currentPrice.value) {
    return {
      fullLabel: '-',
    }
  }

  const parsed = new Date(currentPrice.value.effectiveDate)
  if (Number.isNaN(parsed.getTime())) {
    return {
      fullLabel: '-',
    }
  }

  const fullLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)

  return {
    fullLabel: fullLabel.charAt(0).toUpperCase() + fullLabel.slice(1),
  }
})

const priceTrend = computed(() => {
  const comparison = currentPrice.value?.comparison
  if (!comparison) {
    return {
      label: 'Tetap',
      toneClass: 'text-ink-700 bg-slate-100 border-slate-200',
      icon: 'minus' as const,
    }
  }

  if (comparison.trend === 'NAIK') {
    return {
      label: comparison.differencePerKg
        ? `Naik ${formatRupiah(comparison.differencePerKg)}`
        : 'Naik',
      toneClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: 'arrowUp' as const,
    }
  }

  if (comparison.trend === 'TURUN') {
    return {
      label: comparison.differencePerKg
        ? `Turun ${formatRupiah(comparison.differencePerKg)}`
        : 'Turun',
      toneClass: 'text-rose-700 bg-rose-50 border-rose-200',
      icon: 'arrowDown' as const,
    }
  }

  if (comparison.trend === 'TETAP') {
    return {
      label: 'Tetap',
      toneClass: 'text-ink-700 bg-slate-100 border-slate-200',
      icon: 'minus' as const,
    }
  }

  return {
    label: 'Tetap',
    toneClass: 'text-ink-700 bg-slate-100 border-slate-200',
    icon: 'minus' as const,
  }
})

async function loadPublicationData() {
  loading.value = true
  error.value = ''

  try {
    const [current, share] = await Promise.all([
      api.request<PublicCurrentPrice>('/public/prices/current', { auth: false }),
      api.request<PublicShareText>('/public/prices/share-text', { auth: false }),
    ])

    currentPrice.value = current
    shareText.value = share.text
  }
  catch (caught) {
    const mapped = api.mapError(caught)
    error.value = mapped.status === 404
      ? 'Harga hari ini belum tersedia. Silakan cek lagi beberapa saat lagi.'
      : mapped.message
  }
  finally {
    loading.value = false
  }
}

async function refreshPublication() {
  refreshing.value = true
  await loadPublicationData()
  shareImageVersion.value = Date.now()
  refreshing.value = false

  if (!error.value) {
    toast.success('Data diperbarui', 'Informasi harga terbaru berhasil dimuat ulang.')
  }
}

onMounted(loadPublicationData)
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-shell">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl" />
      <div class="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />
      <div class="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-100/60 blur-3xl" />
    </div>

    <main class="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-10 sm:px-6 lg:px-8">
      <header class="mx-auto max-w-3xl text-center">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Telurio</p>
        <h1 class="mt-2 text-3xl font-semibold text-ink-900 sm:text-4xl">Harga Telur Hari Ini</h1>
        <p class="mt-3 text-sm text-ink-600 sm:text-base">
          Harga telur hari ini mengacu harga standar yang ada di Provinsi Lampung.
        </p>

        <div class="mt-4 flex justify-center">
          <UiButton icon="refresh" variant="secondary" :disabled="refreshing" @click="refreshPublication">
            {{ refreshing ? 'Memuat...' : 'Refresh harga' }}
          </UiButton>
        </div>
      </header>

      <div class="mx-auto mt-8 w-full max-w-2xl">
        <GlassCard>
          <div v-if="loading" class="space-y-3">
            <div class="h-7 w-40 animate-pulse rounded-xl bg-slate-200/70" />
            <div class="h-12 w-72 animate-pulse rounded-2xl bg-slate-200/70" />
            <div class="h-5 w-56 animate-pulse rounded-lg bg-slate-200/60" />
          </div>

          <div v-else-if="error" class="space-y-4">
            <p class="text-lg font-semibold text-ink-900">Harga hari ini belum siap dipublikasi</p>
            <p class="text-sm text-ink-600">{{ error }}</p>
            <UiButton icon="refresh" @click="refreshPublication">Coba lagi</UiButton>
          </div>

          <div v-else class="space-y-5">
            <div class="flex items-start justify-between gap-3">
              <div class="inline-flex items-center rounded-full border border-brand-200/70 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                Update Terbaru
              </div>

              <PublicPriceShareMenu
                :share-text="shareText"
                :effective-date="currentPrice?.effectiveDate ?? null"
                :image-version="shareImageVersion"
              />
            </div>

            <div>
              <p class="text-sm text-ink-500">Harga Referensi Hari Ini</p>
              <p class="mt-1 text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">{{ formattedPrice }}<span class="ml-2 text-xl text-ink-500">/kg</span></p>
              <div class="mt-4 flex w-full items-center justify-between rounded-2xl border border-brand-200/70 bg-brand-50/80 px-4 py-3">
                <p class="text-sm font-medium text-ink-900">{{ dateDisplay.fullLabel }}</p>
                <div
                  class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                  :class="priceTrend.toneClass"
                >
                  <UiIcon :name="priceTrend.icon" class="h-3.5 w-3.5" />
                  <span>{{ priceTrend.label }}</span>
                </div>
              </div>
              <p class="mt-2 text-xs text-ink-600">
                *Harga dapat berbeda tergantung negosiasi tiap transaksi.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div class="mx-auto mt-5 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        <div class="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <UiIcon name="calendar" class="h-4 w-4" />
            </span>
            <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Update</p>
          </div>
          <p class="mt-2 text-sm font-regular text-ink-900">Diperbarui harian</p>
        </div>

        <div class="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
              <UiIcon name="delivery" class="h-4 w-4" />
            </span>
            <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Delivery</p>
          </div>
          <p class="mt-2 text-sm font-regular text-ink-900">Siap kirim ke pelanggan</p>
        </div>

        <div class="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <UiIcon name="prices" class="h-4 w-4" />
            </span>
            <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Sumber</p>
          </div>
          <p class="mt-2 text-sm font-regular text-ink-900">Referensi pasar Lampung</p>

        </div>
      </div>
    </main>
  </div>
</template>
