<script setup lang="ts">
import type { CoopItem } from '../types/domain'
import { defaultPageSizeOptions } from '../utils/list'

definePageMeta({
  title: 'Coops',
  roles: ['ADMIN'],
})

const api = useApi()
const toast = useToast()
const pagination = usePagination()
const { t } = useI18n()

const loading = ref(true)
const error = ref('')
const coops = ref<CoopItem[]>([])
const activeFilter = ref('')
const dialogOpen = ref(false)
const editing = ref<CoopItem | null>(null)
const submitting = ref(false)
const sortBy = ref('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = computed(() => [
  { label: t('common.createdAt'), value: 'createdAt', kind: 'date' as const },
  { label: t('livestock.lastUpdate'), value: 'updatedAt', kind: 'date' as const },
  { label: t('common.name'), value: 'name', kind: 'text' as const },
  { label: t('coopProfile.population'), value: 'population', kind: 'number' as const },
])
const pageSizeOptions: number[] = [...defaultPageSizeOptions]
const skeletonCells = [
  { lines: [{ class: 'w-11/12' }, { class: 'mt-2 w-7/12' }] },
  { lines: [{ class: 'w-16' }] },
  { lines: [{ class: 'w-14' }] },
  { lines: [{ class: 'w-20 rounded-full' }] },
  { lines: [{ class: 'ml-auto w-20 rounded-xl' }] },
]

const { sortOrderOptions } = useListSort(sortBy, orderByOptions)
const pageRangeLabel = usePageRangeLabel(pagination)
const { draftFilters, applyDrafts, resetActive } = useListFilterDrafts({
  active: activeFilter,
})

async function resetFilters() {
  resetActive()
  pagination.resetPage()
  await loadCoops()
}

async function applyFilters() {
  applyDrafts()
  pagination.resetPage()
  await loadCoops()
}

async function loadCoops() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getPage<CoopItem[]>('/coops', {
      ...pagination.query.value,
      sortBy: sortBy.value,
      order: sortOrder.value,
      isActive: activeFilter.value === '' ? undefined : activeFilter.value === 'true',
    })
    coops.value = response.data
    pagination.applyMeta(response.meta)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function submitCoop(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/coops/${editing.value.id}`, payload)
      toast.success(t('toast.coop.updated'))
    } else {
      await api.post('/coops', payload)
      toast.success(t('toast.coop.created'))
    }
    dialogOpen.value = false
    editing.value = null
    await loadCoops()
  } catch (caught) {
    toast.error(t('toast.coop.saveFailed'), api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function onPageChange(nextPage: number) {
  pagination.setPage(nextPage)
  await loadCoops()
}

async function onLimitChange(nextLimit: number) {
  pagination.setLimit(nextLimit)
  await loadCoops()
}

onMounted(loadCoops)

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadCoops()
  }
})

</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard
      icon="coops"
      :title="t('coop.listTitle')"
      :description="t('coop.listDescription')"
    >
      <template #actions>
        <UiButton
          variant="secondary"
          icon="refresh"
          :title="t('common.refresh')"
          :aria-label="t('common.refresh')"
          @click="loadCoops"
        />
        <UiButton icon="plus" @click="dialogOpen = true; editing = null">{{ t('common.add') }}</UiButton>
      </template>
    </ListHeaderCard>

    <ListTableShell
      :filter-applied="Boolean(activeFilter)"
      :page-range-label="pageRangeLabel"
      :current-limit="pagination.limit.value"
      :page-size-options="pageSizeOptions"
      :loading="loading"
      :has-prev-page="pagination.hasPrevPage.value"
      :has-next-page="pagination.hasNextPage.value"
      filter-menu-width-class="w-[min(92vw,20rem)]"
      @previous-page="onPageChange(pagination.page.value - 1)"
      @next-page="onPageChange(pagination.page.value + 1)"
      @change-limit="onLimitChange"
    >
      <template #sort-menu>
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">{{ t('common.sort') }}</p>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <select
              :value="sortBy"
              class="field-shell py-2.5"
              @change="sortBy = ($event.target as HTMLSelectElement).value"
            >
              <option v-for="item in orderByOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
            <select
              :value="sortOrder"
              class="field-shell py-2.5"
              @change="sortOrder = ($event.target as HTMLSelectElement).value as 'asc' | 'desc'"
            >
              <option v-for="item in sortOrderOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </div>
      </template>

      <template #filter-menu>
          <div class="mb-3 flex items-center gap-2">
            <UiIcon name="filter" class="h-4 w-4 text-brand-700" />
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">{{ t('common.dataFilter') }}</p>
          </div>

          <div class="space-y-1.5">
            <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
              <UiIcon name="coops" class="h-3.5 w-3.5 text-ink-500" />
              <span>{{ t('coop.status') }}</span>
            </p>
            <select
              :value="draftFilters.active"
              class="field-shell py-2.5"
              @change="draftFilters.active = ($event.target as HTMLSelectElement).value"
            >
              <option value="">{{ t('coop.allStatuses') }}</option>
              <option value="true">{{ t('common.active') }}</option>
              <option value="false">{{ t('common.inactive') }}</option>
            </select>
          </div>

          <div class="mt-3 flex items-center justify-end gap-2 border-t border-slate-200/80 pt-3">
            <UiButton size="sm" variant="ghost" icon="refresh" @click="resetFilters">
              {{ t('common.reset') }}
            </UiButton>
            <UiButton size="sm" icon="filter" @click="applyFilters">
              {{ t('common.apply') }}
            </UiButton>
          </div>
      </template>

      <template #default>
        <table class="min-w-full text-left text-sm">
          <thead class="sticky top-0 z-10 bg-white/90 text-ink-500 backdrop-blur-sm">
            <tr>
              <th class="px-4 py-3 pr-4">{{ t('common.name') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('coopProfile.population') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('coop.depreciation') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('common.status') }}</th>
              <th class="px-4 py-3 pr-4 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <ListTableSkeletonBody
            v-if="loading"
            :rows="pagination.limit.value"
            row-key-prefix="coops-skeleton"
            :cells="skeletonCells"
          />
          <ListTableStateBody
            v-else-if="error"
            mode="error"
            :colspan="5"
            :message="error"
            @retry="loadCoops"
          />
          <tbody v-else-if="coops.length">
            <tr v-for="coop in coops" :key="coop.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4">
                <p class="font-medium text-ink-900">{{ coop.name }}</p>
                <p class="text-xs text-ink-500">{{ coop.chickenStrain || '-' }}</p>
              </td>
              <td class="px-4 py-4 pr-4">{{ coop.population }}</td>
              <td class="px-4 py-4 pr-4">{{ coop.depreciationPercent }}%</td>
              <td class="px-4 py-4 pr-4">
                <UiBadge :tone="coop.isActive ? 'success' : 'danger'">
                  {{ coop.isActive ? t('common.active') : t('common.inactive') }}
                </UiBadge>
              </td>
              <td class="px-4 py-4 text-right">
                <UiButton
                  variant="ghost"
                  size="sm"
                  icon="edit"
                  @click="dialogOpen = true; editing = coop"
                >
                  {{ t('common.edit') }}
                </UiButton>
              </td>
            </tr>
          </tbody>
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="5"
            :message="t('coop.emptyFiltered')"
          />
        </table>
      </template>
    </ListTableShell>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? t('coop.dialogTitle.edit') : t('coop.dialogTitle.add')"
      :description="t('coop.dialogDescription')"
    >
      <FormsCoopForm
        :initial-value="editing ? {
          name: editing.name,
          population: String(editing.population),
          chickenStrain: editing.chickenStrain ?? '',
          chickBirthDate: editing.chickBirthDate ? isoDate(editing.chickBirthDate) : '',
          depreciationPercent: editing.depreciationPercent,
          isActive: editing.isActive,
        } : undefined"
        :submitting="submitting"
        @submit="submitCoop"
      />
    </UiDialog>
  </div>
</template>
