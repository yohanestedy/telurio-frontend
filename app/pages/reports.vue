<script setup lang="ts">
import type {
  GrossIncomeItem,
  MonthlySummaryResponse,
  NetIncomeItem,
} from '../types/domain'
import { useCoopOptions } from '../composables/useCoopOptions'
import { useOwnerOptions } from '../composables/useOwnerOptions'

definePageMeta({
  title: 'Reports',
  roles: ['ADMIN', 'OWNER'],
})

const api = useApi()
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const loading = ref(true)
const error = ref('')
const grossIncome = ref<GrossIncomeItem[]>([])
const netIncome = ref<NetIncomeItem[]>([])
const monthlySummary = ref<MonthlySummaryResponse | null>(null)

const now = new Date()
const month = ref(String(now.getMonth() + 1))
const year = ref(String(now.getFullYear()))
const coopId = ref('')
const ownerId = ref('')

const { coopOptions, loadCoops } = useCoopOptions()
const { owners, ownerOptions, loadOwners } = useOwnerOptions()

async function loadSupporting() {
  await Promise.all([
    loadCoops(),
    auth.role === 'ADMIN' ? loadOwners().catch(() => undefined) : Promise.resolve(),
  ])

  if (auth.role !== 'ADMIN') {
    owners.value = []
  }
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
    toast.error(t('report.loadFailed'), error.value)
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
      <UiInput v-model="month" :label="t('common.month')" type="number" />
      <UiInput v-model="year" :label="t('common.year')" type="number" />
      <UiSelect v-model="coopId" :options="coopOptions" :label="t('common.coop')" :placeholder="t('report.coopPlaceholder')" />
      <UiSelect
        v-if="auth.role === 'ADMIN'"
        v-model="ownerId"
        :options="ownerOptions"
        :label="t('report.ownerSummary')"
        :placeholder="t('report.ownerPlaceholder')"
      />
      <template #actions>
        <UiButton icon="refresh" @click="loadReports">{{ t('common.refresh') }}</UiButton>
      </template>
    </FilterBar>

    <div v-if="loading" class="space-y-4">
      <LoadingSkeleton variant="table" :rows="6" :columns="4" />
      <LoadingSkeleton variant="table" :rows="6" :columns="5" />
      <LoadingSkeleton variant="table" :rows="6" :columns="4" />
    </div>
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="loadReports">{{ t('common.retry') }}</UiButton>
    </ErrorState>
    <template v-else>
      <TableCard :title="t('report.grossIncome.title')" :description="t('report.grossIncome.description')" icon="reports">
        <table class="min-w-full text-left text-sm">
          <thead class="text-ink-500">
            <tr>
              <th class="pb-3 pr-4">{{ t('common.coop') }}</th>
              <th class="pb-3 pr-4">{{ t('report.grossIncome.deliveredKg') }}</th>
              <th class="pb-3 pr-4">{{ t('report.grossIncome.avgPrice') }}</th>
              <th class="pb-3 pr-4">{{ t('report.grossIncome.title') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in grossIncome" :key="item.coopId" class="border-t border-white/40">
              <td class="py-4 pr-4">{{ item.coopName }}</td>
              <td class="py-4 pr-4">{{ formatKg(item.totalDeliveredKg) }}</td>
              <td class="py-4 pr-4">{{ formatMoneyNumber(item.avgPricePerKg) }}</td>
              <td class="py-4 pr-4 font-medium text-ink-900">{{ formatMoneyNumber(item.grossIncome) }}</td>
            </tr>
          </tbody>
        </table>
      </TableCard>

      <TableCard :title="t('report.netIncome.title')" :description="t('report.netIncome.description')" icon="money">
        <table class="min-w-full text-left text-sm">
          <thead class="text-ink-500">
            <tr>
              <th class="pb-3 pr-4">{{ t('common.coop') }}</th>
              <th class="pb-3 pr-4">{{ t('report.netIncome.gross') }}</th>
              <th class="pb-3 pr-4">{{ t('report.netIncome.expenses') }}</th>
              <th class="pb-3 pr-4">{{ t('report.netIncome.depreciation') }}</th>
              <th class="pb-3 pr-4">{{ t('report.netIncome.net') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in netIncome" :key="item.coopId" class="border-t border-white/40">
              <td class="py-4 pr-4">{{ item.coopName }}</td>
              <td class="py-4 pr-4">{{ formatMoneyNumber(item.grossIncome) }}</td>
              <td class="py-4 pr-4">{{ formatMoneyNumber(item.totalExpenses) }}</td>
              <td class="py-4 pr-4">{{ formatMoneyNumber(item.depreciation) }}</td>
              <td class="py-4 pr-4 font-medium text-ink-900">{{ formatMoneyNumber(item.netIncome) }}</td>
            </tr>
          </tbody>
        </table>
      </TableCard>

      <TableCard
        :title="t('report.ownerSummary.title')"
        :description="t('report.ownerSummary.description')"
        icon="wallet"
      >
        <div v-if="monthlySummary" class="space-y-4">
          <MetricCard
            :label="t('report.ownerSummary.totalShare')"
            :value="formatRupiah(monthlySummary.totalOwnerShare)"
            :helper="`${monthlySummary.ownerName} • ${monthlySummary.month}/${monthlySummary.year}`"
            icon="wallet"
          />
          <table class="min-w-full text-left text-sm">
            <thead class="text-ink-500">
              <tr>
                <th class="pb-3 pr-4">{{ t('common.coop') }}</th>
                <th class="pb-3 pr-4">{{ t('report.ownerSummary.sharePercent') }}</th>
                <th class="pb-3 pr-4">{{ t('report.netIncome.title') }}</th>
                <th class="pb-3 pr-4">{{ t('report.ownerSummary.ownerShare') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in monthlySummary.coops" :key="item.coopId" class="border-t border-white/40">
                <td class="py-4 pr-4">{{ item.coopName }}</td>
                <td class="py-4 pr-4">{{ item.ownershipSharePercent }}%</td>
                <td class="py-4 pr-4">{{ formatMoneyNumber(item.netIncome) }}</td>
                <td class="py-4 pr-4 font-medium text-ink-900">{{ formatMoneyNumber(item.ownerShare) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-ink-500">
          {{ t('report.ownerSummary.empty') }}
        </p>
      </TableCard>
    </template>
  </div>
</template>
