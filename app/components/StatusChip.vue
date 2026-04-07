<script setup lang="ts">
import type { DeliveryStatus, PaymentStatus } from '../types/domain'

interface Props {
  kind: 'delivery' | 'payment'
  value: DeliveryStatus | PaymentStatus
}

const props = defineProps<Props>()

const tone = computed(() => {
  if (props.kind === 'delivery') {
    return {
      BELUM_DIHANTAR: 'warning',
      SEDANG_DIHANTAR: 'info',
      SUDAH_DIHANTAR: 'success',
    }[props.value as DeliveryStatus] as 'warning' | 'info' | 'success'
  }

  return {
    BELUM_BAYAR: 'danger',
    DP: 'warning',
    LUNAS: 'success',
  }[props.value as PaymentStatus] as 'danger' | 'warning' | 'success'
})

const label = computed(() =>
  props.kind === 'delivery'
    ? deliveryStatusLabel(props.value as DeliveryStatus)
    : paymentStatusLabel(props.value as PaymentStatus),
)
</script>

<template>
  <UiBadge :tone="tone">
    {{ label }}
  </UiBadge>
</template>
