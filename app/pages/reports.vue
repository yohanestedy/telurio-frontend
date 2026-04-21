<script setup lang="ts">
import type {
  CoopItem,
  GrossIncomeItem,
  MonthlySummaryResponse,
  NetIncomeItem,
  UserItem,
} from '../types/domain'

definePageMeta({
  title: 'Reports',
  roles: ['ADMIN', 'OWNER'],
})

const api = useApi()
const auth = useAuthStore()
const toast = useToast()

const loading = ref(true)
const error = ref('')
const grossIncome = ref<GrossIncomeItem[]>([])
const netIncome = ref<NetIncomeItem[]>([])
const monthlySummary = ref<MonthlySummaryResponse | null>(null)
const coops = ref<CoopItem[]>([])
const owners = ref<UserItem[]>([])

const now = new Date()
const month = ref(String(now.getMonth() + 1))
const year = ref(String(now.getFullYear()))
const coopId = ref('')
const ownerId = ref('')

const coopOptions = computed(() =>
  coops.value.map((item) => ({ label: item.name, value: item.id })),
)
const ownerOptions = computed(() =>
  owners.value.map((item) => ({ label: item.name, value: item.id })),
)

async function loadSupporting() {
  const [coopList, ownerList] = await Promise.all([
    api.getPage<CoopItem[]>('/coops', { all: true }),
    auth.role === 'ADMIN'
      ? api.getPage<UserItem[]>('/users', { all: true, role: 'OWNER' })
      : Promise.resolve({ data: [] as UserItem[] }),
  ])

  coops.value = coopList.data
  owners.value = ownerList.data
}

async function loadReports() {
  loading.value = true
  error.value = ''
  try {
    const query = {
      month: Number(month.value),
      year: Number(year.value),
      coopId: coopId.value || undefined,
      ownerId: auth.role === 'ADMIN' ? ownerId.value || undefined : undefined,
    }

    const tasks: Array<Promise<unknown>> = [
      api.get<GrossIncomeItem[]>('/reports/gross-income', query).then((value) => {
        grossIncome.value = value
      }),
      api.get<NetIncomeItem[]>('/reports/net-income', query).then((value) => {
        netIncome.value = value
      }),
    ]

    if (auth.role === 'OWNER' || ownerId.value) {
      tasks.push(
        api
          .get<MonthlySummaryResponse>('/reports/monthly-summary', {
            month: Number(month.value),
            year: Number(year.value),
            ownerId: auth.role === 'ADMIN' ? ownerId.value : undefined,
          })
          .then((value) => {
            monthlySummary.value = value
          }),
      )
    } else {
      monthlySummary.value = null
    }

    await Promise.all(tasks)
  } catch (caught) {
    error.value = api.mapError(caught).message
    toast.error('Gagal memuat laporan', error.value)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadSupporting(), loadReports()])
})
</script>

<template>
  <div class="space-y-6">
    <FilterBar>
      <UiInput v-model="month" label="Bulan" type="number" />
      <UiInput v-model="year" label="Tahun" type="number" />
      <UiSelect v-model="coopId" :options="coopOptions" label="Kandang" placeholder="Semua kandang" />
      <UiSelect
        v-if="auth.role === 'ADMIN'"
        v-model="ownerId"
        :options="ownerOptions"
        label="Owner summary"
        placeholder="Pilih owner"
      />
      <template #actions>
        <UiButton icon="refresh" @click="loadReports">Refresh</UiButton>
      </template>
    </FilterBar>

    <div v-if="loading" class="space-y-4">
      <LoadingSkeleton variant="table" :rows="6" :columns="4" />
      <LoadingSkeleton variant="table" :rows="6" :columns="5" />
      <LoadingSkeleton variant="table" :rows="6" :columns="4" />
    </div>
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="loadReports">Coba lagi</UiButton>
    </ErrorState>
    <template v-else>
      <TableCard title="Gross Income" description="Pendapatan kotor per kandang dari source allocation order yang sudah delivered." icon="reports">
        <table class="min-w-full text-left text-sm">
          <thead class="text-ink-500">
            <tr>
              <th class="pb-3 pr-4">Kandang</th>
              <th class="pb-3 pr-4">Delivered Kg</th>
              <th class="pb-3 pr-4">Avg Price</th>
              <th class="pb-3 pr-4">Gross Income</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in grossIncome" :key="item.coopId" class="border-t border-white/40">
              <td class="py-4 pr-4">{{ item.coopName }}</td>
              <td class="py-4 pr-4">{{ formatKg(item.totalDeliveredKg) }}</td>
              <td class="py-4 pr-4">{{ formatRupiah(item.avgPricePerKg) }}</td>
              <td class="py-4 pr-4 font-medium text-ink-900">{{ formatRupiah(item.grossIncome) }}</td>
            </tr>
          </tbody>
        </table>
      </TableCard>

      <TableCard title="Net Income" description="Gross income dikurangi expense dan penyusutan aktif kandang." icon="money">
        <table class="min-w-full text-left text-sm">
          <thead class="text-ink-500">
            <tr>
              <th class="pb-3 pr-4">Kandang</th>
              <th class="pb-3 pr-4">Gross</th>
              <th class="pb-3 pr-4">Expenses</th>
              <th class="pb-3 pr-4">Depreciation</th>
              <th class="pb-3 pr-4">Net</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in netIncome" :key="item.coopId" class="border-t border-white/40">
              <td class="py-4 pr-4">{{ item.coopName }}</td>
              <td class="py-4 pr-4">{{ formatRupiah(item.grossIncome) }}</td>
              <td class="py-4 pr-4">{{ formatRupiah(item.totalExpenses) }}</td>
              <td class="py-4 pr-4">{{ formatRupiah(item.depreciation) }}</td>
              <td class="py-4 pr-4 font-medium text-ink-900">{{ formatRupiah(item.netIncome) }}</td>
            </tr>
          </tbody>
        </table>
      </TableCard>

      <TableCard
        title="Monthly Summary Owner"
        description="Ringkasan owner share per kandang berdasarkan ownership share percent."
        icon="wallet"
      >
        <div v-if="monthlySummary" class="space-y-4">
          <MetricCard
            label="Total Owner Share"
            :value="formatRupiah(monthlySummary.totalOwnerShare)"
            :helper="`${monthlySummary.ownerName} • ${monthlySummary.month}/${monthlySummary.year}`"
            icon="wallet"
          />
          <table class="min-w-full text-left text-sm">
            <thead class="text-ink-500">
              <tr>
                <th class="pb-3 pr-4">Kandang</th>
                <th class="pb-3 pr-4">Share %</th>
                <th class="pb-3 pr-4">Net Income</th>
                <th class="pb-3 pr-4">Owner Share</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in monthlySummary.coops" :key="item.coopId" class="border-t border-white/40">
                <td class="py-4 pr-4">{{ item.coopName }}</td>
                <td class="py-4 pr-4">{{ item.ownershipSharePercent }}%</td>
                <td class="py-4 pr-4">{{ formatRupiah(item.netIncome) }}</td>
                <td class="py-4 pr-4 font-medium text-ink-900">{{ formatRupiah(item.ownerShare) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-ink-500">
          Pilih owner untuk menampilkan monthly summary atau gunakan akun owner secara langsung.
        </p>
      </TableCard>
    </template>
  </div>
</template>
