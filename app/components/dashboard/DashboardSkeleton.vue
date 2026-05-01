<template>
  <div class="space-y-6">
    <div class="relative z-20 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <GlassCard
        v-for="card in 4"
        :key="`metric-${card}`"
        :overflow-visible="true"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="h-3 w-28 skeleton-block" />
          <div class="h-9 w-9 rounded-2xl skeleton-block" />
        </div>
        <div class="mt-4 h-8 w-32 skeleton-block" />
        <div class="mt-3 h-4 w-44 max-w-full skeleton-block" />
      </GlassCard>
    </div>

    <div class="grid gap-6 min-[1024px]:grid-cols-10 min-[1024px]:items-stretch min-[1866px]:grid-cols-12">
      <GlassCard
        class="min-[1024px]:order-1 min-[1024px]:col-span-6 min-[1024px]:h-full min-[1866px]:col-span-4"
      >
          <div class="mb-4 flex items-start gap-3">
            <div class="h-10 w-10 rounded-2xl skeleton-block" />
            <div class="space-y-2">
              <div class="h-5 w-44 skeleton-block" />
              <div class="h-3 w-64 max-w-full skeleton-block" />
            </div>
          </div>

          <div class="space-y-2.5">
            <article
              v-for="card in 2"
              :key="`livestock-${card}`"
              class="rounded-2xl border border-white/70 bg-white/88 px-3 py-3 shadow-[0_8px_18px_rgba(67,63,57,0.07)] sm:px-3.5 sm:py-3.5"
            >
              <div class="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                <div class="flex min-w-0 items-center gap-2">
                  <div class="h-10 w-10 rounded-xl skeleton-block" />
                  <div class="min-w-0 space-y-2">
                    <div class="flex items-center gap-2">
                      <div class="h-5 w-32 skeleton-block" />
                      <div class="h-5 w-12 rounded-full skeleton-block" />
                    </div>
                  </div>
                </div>

                <div class="space-y-2 md:text-right">
                  <div class="h-6 w-24 skeleton-block md:ml-auto" />
                  <div class="h-3 w-32 skeleton-block md:ml-auto" />
                </div>
              </div>

              <div class="mt-2.5 grid gap-2 xl:grid-cols-2">
                <section
                  v-for="section in 2"
                  :key="`livestock-section-${card}-${section}`"
                  class="rounded-xl border border-white/70 bg-white/55"
                >
                  <div class="flex items-center gap-2 border-b border-white/70 px-2.5 py-2">
                    <div class="h-6 w-6 rounded-full skeleton-block" />
                    <div class="h-4 w-24 skeleton-block" />
                  </div>
                  <div class="space-y-2 px-2.5 py-2">
                    <div class="flex items-center justify-between gap-2">
                      <div class="h-3.5 w-28 skeleton-block" />
                      <div class="h-3.5 w-12 skeleton-block" />
                    </div>
                    <div class="flex items-center justify-between gap-2">
                      <div class="h-3.5 w-24 skeleton-block" />
                      <div class="h-3.5 w-10 skeleton-block" />
                    </div>
                  </div>
                  <div class="flex items-center justify-between border-t border-white/70 px-2.5 py-2">
                    <div class="h-4 w-20 skeleton-block" />
                    <div class="h-5 w-14 skeleton-block" />
                  </div>
                </section>
              </div>

              <div class="mt-2.5 flex items-center justify-between gap-2 border-t border-white/90 pt-2">
                <div class="h-3.5 w-40 skeleton-block" />
                <div class="h-8 w-24 rounded-xl skeleton-block" />
              </div>
            </article>
          </div>
      </GlassCard>

      <GlassCard
        class="min-[1024px]:order-2 min-[1024px]:col-span-4 min-[1024px]:h-full min-[1866px]:col-span-3"
      >
          <div class="mb-4 flex items-start gap-3">
            <div class="h-10 w-10 rounded-2xl skeleton-block" />
            <div class="space-y-2">
              <div class="h-5 w-44 skeleton-block" />
              <div class="h-3 w-56 max-w-full skeleton-block" />
            </div>
          </div>

          <div class="space-y-4">
            <section
              v-for="section in 2"
              :key="`orders-section-${section}`"
              class="overflow-hidden rounded-2xl border border-white/70 bg-white/55"
            >
              <div class="flex items-center justify-between gap-2 border-b border-white/70 px-3 py-2.5">
                <div class="h-5 w-20 skeleton-block" />
                <div class="h-6 w-32 rounded-full skeleton-block" />
              </div>
              <div class="space-y-3 p-3">
                <article
                  v-for="order in 2"
                  :key="`order-${section}-${order}`"
                  class="overflow-hidden rounded-2xl border border-white/70 bg-white/80"
                >
                  <div class="h-1.5 skeleton-block" />
                  <div class="p-3">
                    <div class="flex items-center justify-between gap-3">
                      <div class="h-5 w-28 skeleton-block" />
                      <div class="h-5 w-24 rounded-full skeleton-block" />
                    </div>
                    <div class="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-white/70 bg-white/65 p-3">
                      <div
                        v-for="column in 3"
                        :key="`order-stat-${section}-${order}-${column}`"
                        class="space-y-2"
                      >
                        <div class="mx-auto h-3 w-12 skeleton-block" />
                        <div class="mx-auto h-4 w-14 skeleton-block" />
                      </div>
                    </div>
                    <div class="mt-3 flex items-center gap-2">
                      <div class="h-5 w-20 rounded-full skeleton-block" />
                      <div class="h-8 w-24 rounded-xl skeleton-block" />
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </div>
      </GlassCard>

      <GlassCard
        class="min-[1024px]:order-3 min-[1024px]:col-span-10 min-[1581px]:col-span-6 min-[1024px]:h-full min-[1866px]:col-span-5"
      >
          <div class="mb-4 flex items-start gap-3">
            <div class="h-10 w-10 rounded-2xl skeleton-block" />
            <div class="space-y-2">
              <div class="h-5 w-40 skeleton-block" />
              <div class="h-3 w-64 max-w-full skeleton-block" />
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
              <div class="grid grid-cols-4 gap-2">
                <div
                  v-for="tab in 4"
                  :key="`period-${tab}`"
                  class="h-9 w-20 rounded-full skeleton-block"
                />
              </div>
              <div class="h-10 w-52 rounded-2xl skeleton-block" />
            </div>

            <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div
                v-for="metric in 4"
                :key="`production-metric-${metric}`"
                class="rounded-2xl border border-white/70 bg-white/65 p-3"
              >
                <div class="h-4 w-24 skeleton-block" />
                <div class="mt-3 h-6 w-20 skeleton-block" />
              </div>
            </div>

            <div class="rounded-2xl border border-white/70 bg-white/60 p-4">
              <div class="flex items-center gap-4">
                <div class="h-4 w-28 skeleton-block" />
                <div class="h-4 w-28 skeleton-block" />
              </div>
              <div class="mt-6 h-56 rounded-xl border border-white/70 bg-white/45 p-4">
                <div class="flex h-full flex-col justify-between">
                  <div
                    v-for="line in 5"
                    :key="`chart-line-${line}`"
                    class="h-px bg-slate-200/70"
                  />
                </div>
                <div class="-mt-32 flex items-end justify-between gap-3">
                  <div
                    v-for="dot in 7"
                    :key="`chart-dot-${dot}`"
                    class="h-3 w-3 rounded-full skeleton-block"
                    :class="dot % 2 === 0 ? 'mb-8' : dot % 3 === 0 ? 'mb-14' : 'mb-4'"
                  />
                </div>
              </div>
            </div>
          </div>
      </GlassCard>

      <GlassCard
        class="min-[1024px]:order-4 min-[1024px]:col-span-10 min-[1581px]:col-span-4 min-[1866px]:col-span-12"
      >
          <div class="mb-4 flex items-start gap-3">
            <div class="h-10 w-10 rounded-2xl skeleton-block" />
            <div class="space-y-2">
              <div class="h-5 w-36 skeleton-block" />
              <div class="h-3 w-64 max-w-full skeleton-block" />
            </div>
          </div>

          <div class="grid gap-3 md:grid-cols-2 min-[1581px]:grid-cols-1 min-[1866px]:grid-cols-2">
            <article
              v-for="coop in 2"
              :key="`coop-profile-${coop}`"
              class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75"
            >
              <div class="p-3.5">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5">
                    <div class="h-9 w-9 rounded-xl skeleton-block" />
                    <div class="h-5 w-32 skeleton-block" />
                    <div class="h-5 w-12 rounded-full skeleton-block" />
                  </div>
                  <div class="h-8 w-8 rounded-xl skeleton-block" />
                </div>

                <div class="mt-3 h-px bg-slate-200/70" />

                <div class="mt-3 grid grid-cols-[minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1.3fr)] gap-2">
                  <div
                    v-for="column in 3"
                    :key="`coop-column-${coop}-${column}`"
                    class="min-w-0 border-r border-slate-200/70 pr-2 last:border-r-0 last:pr-0"
                  >
                    <div class="h-3 w-16 skeleton-block" />
                    <div class="mt-2 h-5 w-24 max-w-full skeleton-block" />
                    <div v-if="column === 3" class="mt-1 h-3 w-20 skeleton-block" />
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 border-t border-emerald-100/70 bg-emerald-50/45 px-3.5 py-2.5">
                <div class="h-3.5 w-3.5 rounded-full skeleton-block" />
                <div class="h-3.5 w-36 skeleton-block" />
              </div>
            </article>
          </div>
      </GlassCard>
    </div>
  </div>
</template>
