<template>
  <div class="glass-subtle rounded-[24px] p-4">
    <div class="mb-3 flex items-center gap-2 text-sm font-medium text-brand-800">
      <UiIcon name="filter" class="h-4 w-4" />
      <span>Filter dan aksi cepat</span>
    </div>
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
