<template>
  <div class="glass-subtle rounded-[24px] p-4">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div class="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <slot />
      </div>
      <div class="flex flex-wrap gap-2">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
