<template>
  <div class="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(0,1fr)] xl:gap-6">
    <div class="space-y-4">
      <GlassCard class="p-4 sm:p-5">
        <div class="space-y-4 animate-pulse">
          <div class="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/75 px-3 py-2.5">
            <div class="h-9 w-9 rounded-xl bg-slate-200/70" />
            <div class="mx-auto h-5 w-44 rounded-md bg-slate-200/70" />
            <div class="h-9 w-9 rounded-xl bg-slate-200/70" />
          </div>

          <div class="flex flex-col gap-3 md:flex-row md:items-center">
            <div class="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/80 p-1 md:flex-1">
              <div
                v-for="index in 3"
                :key="`segment-${index}`"
                class="h-10 flex-1 rounded-xl bg-slate-200/70"
              />
            </div>

            <div class="rounded-2xl border border-white/75 bg-white/88 px-3 py-2.5 md:min-w-[255px]">
              <div class="flex items-center gap-3">
                <div class="h-9 w-9 rounded-2xl bg-slate-200/70" />
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="h-3 w-20 rounded-md bg-slate-200/60" />
                  <div class="h-4 w-24 rounded-md bg-slate-200/70" />
                </div>
                <div class="space-y-2 text-right">
                  <div class="ml-auto h-3 w-14 rounded-md bg-slate-200/60" />
                  <div class="ml-auto h-3 w-16 rounded-md bg-slate-200/70" />
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-7 gap-2">
            <div
              v-for="index in 7"
              :key="`weekday-${index}`"
              class="mx-auto h-3 w-8 rounded-md bg-slate-200/60"
            />
          </div>

          <div class="grid grid-cols-7 gap-2">
            <div
              v-for="cell in 7"
              :key="`cell-${cell}`"
              class="h-16 rounded-2xl border border-white/75 bg-white/92 p-2.5 sm:h-20 sm:p-3"
            >
              <div class="h-4 w-4 rounded-md bg-slate-200/70" />
              <div class="mt-5 flex gap-1 sm:mt-8">
                <div class="h-1.5 w-1.5 rounded-full bg-slate-200/80" />
                <div class="h-1.5 w-1.5 rounded-full bg-slate-200/60" />
              </div>
            </div>
          </div>

          <div class="border-t border-white/70 pt-3">
            <div class="flex flex-wrap gap-3">
              <div
                v-for="index in 3"
                :key="`legend-${index}`"
                class="h-8 w-24 rounded-full bg-slate-200/60"
              />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>

    <div class="space-y-4">
      <GlassCard class="overflow-hidden">
        <div class="animate-pulse">
          <div class="flex items-center justify-between gap-3 border-b border-white/70 px-4 py-3.5 sm:px-5 sm:py-4">
            <div class="space-y-2">
              <div class="h-5 w-28 rounded-md bg-slate-200/70" />
              <div class="h-3 w-20 rounded-md bg-slate-200/60" />
            </div>
            <div class="h-7 w-16 rounded-full bg-slate-200/60" />
          </div>

          <div class="space-y-3 p-3 sm:p-4">
            <div
              v-for="card in 2"
              :key="`order-${card}`"
              class="overflow-hidden rounded-[24px] border border-white/80 bg-white/90 shadow-[0_18px_32px_rgba(15,23,42,0.08)]"
            >
              <div class="h-1.5 bg-slate-200/70" />

              <div class="p-3.5 sm:p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="space-y-2">
                    <div class="h-3 w-16 rounded-md bg-slate-200/60" />
                    <div class="h-5 w-28 rounded-md bg-slate-200/70" />
                  </div>
                  <div class="h-6 w-20 rounded-full bg-slate-200/60" />
                </div>

                <div class="mt-3 rounded-[18px] border border-white/80 bg-white/80 px-3 py-3">
                  <div class="grid grid-cols-3 gap-2">
                    <div class="space-y-2 text-center">
                      <div class="mx-auto h-3 w-12 rounded-md bg-slate-200/60" />
                      <div class="mx-auto h-6 w-14 rounded-md bg-slate-200/70" />
                    </div>
                    <div class="space-y-2 text-center">
                      <div class="mx-auto h-3 w-14 rounded-md bg-slate-200/60" />
                      <div class="mx-auto h-4 w-16 rounded-md bg-slate-200/70" />
                    </div>
                    <div class="space-y-2 text-center">
                      <div class="mx-auto h-3 w-10 rounded-md bg-slate-200/60" />
                      <div class="mx-auto h-4 w-20 rounded-md bg-slate-200/70" />
                    </div>
                  </div>
                </div>

                <div class="mt-3 flex items-center gap-2">
                  <div class="h-3 w-16 rounded-md bg-slate-200/60" />
                  <div class="h-6 w-14 rounded-full bg-slate-200/60" />
                </div>

                <div class="my-3 h-px bg-slate-200/70" />

                <div class="flex flex-wrap gap-2">
                  <div class="h-9 min-w-[130px] flex-1 rounded-xl bg-slate-200/70" />
                  <div class="h-9 w-28 rounded-xl bg-slate-200/60" />
                  <div class="h-9 w-20 rounded-xl bg-slate-200/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard class="p-4 sm:p-5">
        <div class="animate-pulse">
          <div class="h-5 w-40 rounded-md bg-slate-200/70" />

          <div class="mt-3 space-y-2">
            <div class="rounded-2xl border border-white/70 bg-white/80 p-3">
              <div class="h-3 w-20 rounded-md bg-slate-200/60" />
              <div class="mt-3 space-y-2">
                <div
                  v-for="row in 2"
                  :key="`production-${row}`"
                  class="flex items-center justify-between gap-3"
                >
                  <div class="h-4 w-24 rounded-md bg-slate-200/70" />
                  <div class="h-4 w-14 rounded-md bg-slate-200/60" />
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/70 bg-white/80 p-3">
              <div class="h-3 w-24 rounded-md bg-slate-200/60" />
              <div class="mt-3 space-y-2">
                <div
                  v-for="row in 2"
                  :key="`expense-${row}`"
                  class="flex items-center justify-between gap-3"
                >
                  <div class="h-4 w-28 rounded-md bg-slate-200/70" />
                  <div class="h-4 w-20 rounded-md bg-slate-200/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  </div>
</template>
