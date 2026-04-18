<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

interface Props {
  shareText?: string
  effectiveDate?: string | null
  imageVersion?: number | string
  targetPath?: string
  iconOnly?: boolean
  buttonLabel?: string
}

interface PublicShareTextResponse {
  text: string
}

const props = withDefaults(defineProps<Props>(), {
  shareText: '',
  effectiveDate: null,
  imageVersion: 0,
  targetPath: '/public/prices',
  iconOnly: false,
  buttonLabel: 'Share',
})

const api = useApi()
const toast = useToast()
const requestUrl = useRequestURL()
const runtimeConfig = useRuntimeConfig()

const menuOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const resolvedShareText = ref(props.shareText)

watch(
  () => props.shareText,
  (value) => {
    resolvedShareText.value = value
  },
)

const pageUrl = computed(() => {
  const origin = import.meta.client ? window.location.origin : requestUrl.origin
  return `${origin}${props.targetPath}`
})

const shareImageUrl = computed(() =>
  `${runtimeConfig.public.apiBaseUrl}${runtimeConfig.public.apiPrefix}/public/prices/share-image?v=${props.imageVersion}`,
)

const waShareUrl = computed(() => {
  const combined = `${resolvedShareText.value}\n${pageUrl.value}`.trim()
  return `https://wa.me/?text=${encodeURIComponent(combined)}`
})

const buttonClass = computed(() => {
  if (props.iconOnly) {
    return 'inline-flex items-center justify-center rounded-xl border border-orange-100/80 bg-white/82 p-2 text-brand-700 transition hover:bg-orange-50/70'
  }

  return 'inline-flex items-center gap-2 rounded-xl border border-orange-100/80 bg-white/82 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-700 transition hover:bg-orange-50/70'
})

async function ensureShareText() {
  if (resolvedShareText.value.trim()) {
    return resolvedShareText.value
  }

  const response = await api.request<PublicShareTextResponse>(
    '/public/prices/share-text',
    { auth: false },
  )

  resolvedShareText.value = response.text
  return resolvedShareText.value
}

async function copyShareText() {
  if (!import.meta.client) {
    return
  }

  try {
    const text = await ensureShareText()
    await navigator.clipboard.writeText(text)
    toast.success('Teks berhasil disalin')
    menuOpen.value = false
  }
  catch {
    toast.error('Gagal menyalin teks', 'Clipboard tidak tersedia di perangkat ini.')
  }
}

async function copyPageLink() {
  if (!import.meta.client) {
    return
  }

  try {
    await navigator.clipboard.writeText(pageUrl.value)
    toast.success('Link berhasil disalin')
    menuOpen.value = false
  }
  catch {
    toast.error('Gagal menyalin link', 'Clipboard tidak tersedia di perangkat ini.')
  }
}

function extractSvgSize(svgContent: string) {
  const widthMatch = svgContent.match(/width="([\d.]+)(px)?"/i)
  const heightMatch = svgContent.match(/height="([\d.]+)(px)?"/i)

  if (widthMatch && heightMatch) {
    return {
      width: Math.max(1, Math.round(Number(widthMatch[1]))),
      height: Math.max(1, Math.round(Number(heightMatch[1]))),
    }
  }

  const viewBoxMatch = svgContent.match(/viewBox="[\d.\-]+\s+[\d.\-]+\s+([\d.\-]+)\s+([\d.\-]+)"/i)
  if (viewBoxMatch) {
    return {
      width: Math.max(1, Math.round(Number(viewBoxMatch[1]))),
      height: Math.max(1, Math.round(Number(viewBoxMatch[2]))),
    }
  }

  return {
    width: 1080,
    height: 1080,
  }
}

function loadImageFromObjectUrl(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'sync'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load SVG image for conversion'))
    image.src = objectUrl
  })
}

async function convertSvgBlobToPngBlob(svgBlob: Blob): Promise<Blob> {
  const svgContent = await svgBlob.text()
  const { width, height } = extractSvgSize(svgContent)
  const svgObjectUrl = window.URL.createObjectURL(
    new Blob([svgContent], { type: 'image/svg+xml' }),
  )

  try {
    const image = await loadImageFromObjectUrl(svgObjectUrl)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas context is unavailable')
    }

    context.drawImage(image, 0, 0, width, height)

    const pngBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png')
    })

    if (!pngBlob) {
      throw new Error('Unable to create PNG blob')
    }

    return pngBlob
  }
  finally {
    window.URL.revokeObjectURL(svgObjectUrl)
  }
}

async function downloadShareImage() {
  if (!import.meta.client) {
    return
  }

  try {
    const response = await fetch(shareImageUrl.value, {
      credentials: 'omit',
    })

    if (!response.ok) {
      throw new Error('Unable to download image')
    }

    const imageBlob = await response.blob()
    const filenameBase = `harga-telur-${props.effectiveDate ? isoDate(props.effectiveDate) : isoDate(new Date())}`
    let downloadBlob = imageBlob
    let extension: 'png' | 'svg' = 'png'

    if (imageBlob.type === 'image/svg+xml') {
      try {
        downloadBlob = await convertSvgBlobToPngBlob(imageBlob)
      }
      catch {
        downloadBlob = imageBlob
        extension = 'svg'
      }
    }

    const objectUrl = window.URL.createObjectURL(downloadBlob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `${filenameBase}.${extension}`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(objectUrl)

    toast.success(`Gambar ${extension.toUpperCase()} berhasil diunduh`)
    menuOpen.value = false
  }
  catch {
    toast.error('Gagal mengunduh gambar', 'Coba muat ulang halaman lalu ulangi lagi.')
  }
}

onClickOutside(rootRef, () => {
  menuOpen.value = false
})
</script>

<template>
  <div ref="rootRef" class="relative z-[120]">
    <button
      type="button"
      :class="buttonClass"
      @click="menuOpen = !menuOpen"
    >
      <UiIcon name="share" :class="iconOnly ? 'h-4 w-4' : 'h-4 w-4'" />
      <span v-if="!iconOnly">{{ buttonLabel }}</span>
    </button>

    <div
      v-if="menuOpen"
      class="absolute right-0 top-[calc(100%+0.45rem)] z-[130] w-52 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_16px_34px_rgba(15,23,42,0.16)] backdrop-blur"
    >
      <button
        type="button"
        class="w-full rounded-xl px-3 py-2 text-left text-sm text-ink-700 transition hover:bg-slate-100/80"
        @click="copyShareText"
      >
        Copy teks
      </button>
      <button
        type="button"
        class="w-full rounded-xl px-3 py-2 text-left text-sm text-ink-700 transition hover:bg-slate-100/80"
        @click="copyPageLink"
      >
        Copy link
      </button>
      <button
        type="button"
        class="w-full rounded-xl px-3 py-2 text-left text-sm text-ink-700 transition hover:bg-slate-100/80"
        @click="downloadShareImage"
      >
        Unduh gambar
      </button>
      <a
        :href="waShareUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="block w-full rounded-xl px-3 py-2 text-left text-sm text-ink-700 transition hover:bg-slate-100/80"
        @click="menuOpen = false"
      >
        Share ke WhatsApp
      </a>
    </div>
  </div>
</template>
