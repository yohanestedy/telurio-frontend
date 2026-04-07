<script setup lang="ts">
import { resolveAppIcon, type AppIconName } from '../../utils/icons'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  name: AppIconName
}>()

const attrs = useAttrs()
const icon = computed(() => resolveAppIcon(props.name))
</script>

<template>
  <component :is="icon" v-bind="attrs" />
</template>
