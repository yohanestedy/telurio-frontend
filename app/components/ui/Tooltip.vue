<script setup lang="ts">
interface Props {
  text?: string
  offsetX?: number
  offsetY?: number
  disabled?: boolean
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  offsetX: 16,
  offsetY: 16,
  disabled: false,
  delay: 0,
})

const visible = ref(false)
const tooltipRef = ref<HTMLElement | null>(null)

let pendingX = 0
let pendingY = 0
let rafId = 0
let delayTimer: ReturnType<typeof setTimeout> | null = null

function schedule() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    if (tooltipRef.value) {
      tooltipRef.value.style.transform = `translate3d(${pendingX}px, ${pendingY}px, 0)`
    }
  })
}

function show(event: MouseEvent) {
  if (props.disabled || !props.text) return
  pendingX = event.clientX + props.offsetX
  pendingY = event.clientY + props.offsetY

  if (props.delay > 0) {
    if (delayTimer) clearTimeout(delayTimer)
    delayTimer = setTimeout(() => {
      visible.value = true
      schedule()
      delayTimer = null
    }, props.delay)
  } else {
    visible.value = true
    schedule()
  }
}

function move(event: MouseEvent) {
  pendingX = event.clientX + props.offsetX
  pendingY = event.clientY + props.offsetY
  if (visible.value) {
    schedule()
  }
}

function hide() {
  if (delayTimer) {
    clearTimeout(delayTimer)
    delayTimer = null
  }
  visible.value = false
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (delayTimer) clearTimeout(delayTimer)
})
</script>

<template>
  <div
    class="contents"
    @mouseenter="show"
    @mousemove="move"
    @mouseleave="hide"
  >
    <slot />

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150"
        leave-active-class="transition-opacity duration-100"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="visible && text"
          ref="tooltipRef"
          class="pointer-events-none fixed left-0 top-0 z-[200] max-w-xs rounded-xl border border-slate-300/70 bg-white/95 px-3 py-2 text-xs text-ink-700 will-change-transform dark:!border-white/15 dark:!bg-[#201b18]/95 dark:!text-ink-200"
        >
          {{ text }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
