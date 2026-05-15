<script setup lang="ts">
import type { CoopHealthRecordItem, CoopHealthRecordType } from '../types/domain'
import { coopHealthRecordTypes } from '../types/domain'
import { defaultPageSizeOptions } from '../utils/list'
import { usePaginatedLoader } from '../composables/usePaginatedLoader'
import { useCoopOptions } from '../composables/useCoopOptions'
import { useInitialLoad } from '../composables/useInitialLoad'
import { useListPageController } from '../composables/useListPageController'

definePageMeta({ title: 'Coop Health Records', roles: ['ADMIN', 'OWNER', 'OPERATOR'] })

const api = useApi()
const toast = useToast()
const auth = useAuthStore()
const { can } = useAuth()
const pagination = usePagination()
const { t } = useI18n()

const loading = ref(true)
const error = ref('')
const records = ref<CoopHealthRecordItem[]>([])
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const editing = ref<CoopHealthRecordItem | null>(null)
const deleting = ref<CoopHealthRecordItem | null>(null)
const submitting = ref(false)

const coopFilter = ref('')
const typeFilter = ref('')
const startDateFilter = ref('')
const endDateFilter = ref('')
const sortBy = ref<'date' | 'createdAt' | 'type'>('date')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = computed(() => [
  { label: t('common.date'), value: 'date', kind: 'date' as const },
  { label: t('common.createdAt'), value: 'createdAt', kind: 'date' as const },
  { label: t('coopHealth.type'), value: 'type', kind: 'text' as const },
])
const pageSizeOptions = [...defaultPageSizeOptions]
const typeOptions = computed(() => coopHealthRecordTypes.map((item) => ({ label: t(`coopHealth.type.${item}`), value: item })))
const { coopOptions, loadCoops } = useCoopOptions()
const pageRangeLabel = usePageRangeLabel(pagination)
const { sortOrderOptions } = useListSort(sortBy, orderByOptions)

const { load: loadRecords } = usePaginatedLoader<CoopHealthRecordItem[]>({
  loading,
  error,
  assignData: (data) => {
    records.value = data
  },
  fetchPage: () =>
    api.getPage<CoopHealthRecordItem[]>('/coop-health', {
      ...pagination.query.value,
      sortBy: sortBy.value,
      order: sortOrder.value,
      coopId: coopFilter.value || undefined,
      type: typeFilter.value || undefined,
      startDate: startDateFilter.value || undefined,
      endDate: endDateFilter.value || undefined,
    }),
  applyMeta: (meta) => pagination.applyMeta(meta as any),
  mapError: api.mapError,
})

const { draftFilters, resetFilters, applyFilters, onPageChange, onLimitChange } = useListPageController({
  filters: { coopId: coopFilter, type: typeFilter, startDate: startDateFilter, endDate: endDateFilter },
  loading,
  sortBy,
  sortOrder,
  resetPage: pagination.resetPage,
  setPage: pagination.setPage,
  setLimit: pagination.setLimit,
  load: loadRecords,
})

function openCreateDialog() { editing.value = null; dialogOpen.value = true }
function openEditDialog(item: CoopHealthRecordItem) { editing.value = item; dialogOpen.value = true }

async function submitRecord(payload: { date: string; coopId: string; type: CoopHealthRecordType; description: string; notes?: string }) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/coop-health/${editing.value.id}`, payload)
      toast.success(t('toast.coopHealth.updated'))
    } else {
      await api.post('/coop-health', payload)
      toast.success(t('toast.coopHealth.created'))
    }
    dialogOpen.value = false
    editing.value = null
    await loadRecords()
  } catch (caught) {
    toast.error(t('toast.coopHealth.saveFailed'), api.mapError(caught).message)
  } finally { submitting.value = false }
}

async function deleteRecord(payload: { deleteReason: string }) {
  if (!deleting.value) return
  submitting.value = true
  try {
    await api.delete(`/coop-health/${deleting.value.id}`, payload)
    toast.success(t('toast.coopHealth.deleted'))
    deleting.value = null
    deleteDialogOpen.value = false
    await loadRecords()
  } catch (caught) {
    toast.error(t('toast.coopHealth.deleteFailed'), api.mapError(caught).message)
  } finally { submitting.value = false }
}

function typeBadgeClass(type: CoopHealthRecordType) {
  if (type === 'VITAMIN') return 'bg-emerald-100 text-emerald-700'
  if (type === 'VACCINE') return 'bg-sky-100 text-sky-700'
  return 'bg-amber-100 text-amber-700'
}

onMounted(async () => {
  await useInitialLoad([
    { run: loadCoops },
    { run: loadRecords },
  ])
})
</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard icon="coops" :title="t('coopHealth.title')" :description="t('coopHealth.description')">
      <template #actions>
        <UiButton variant="ghost" icon="refresh" :title="t('common.refresh')" :aria-label="t('common.refresh')" @click="loadRecords" />
        <UiButton v-if="can('coop-health.manage')" icon="plus" @click="openCreateDialog">{{ t('common.add') }}</UiButton>
      </template>
    </ListHeaderCard>

    <ListTableShell
      :filter-applied="Boolean(coopFilter) || Boolean(typeFilter) || Boolean(startDateFilter) || Boolean(endDateFilter)"
      :page-range-label="pageRangeLabel"
      :current-limit="pagination.limit.value"
      :page-size-options="pageSizeOptions"
      :loading="loading"
      :has-prev-page="pagination.hasPrevPage.value"
      :has-next-page="pagination.hasNextPage.value"
      @previous-page="onPageChange(pagination.page.value - 1)"
      @next-page="onPageChange(pagination.page.value + 1)"
      @change-limit="onLimitChange"
    >
      <template #sort-menu>
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          <select :value="sortBy" class="field-shell py-2.5" @change="sortBy = ($event.target as HTMLSelectElement).value as 'date' | 'createdAt' | 'type'">
            <option v-for="item in orderByOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <select :value="sortOrder" class="field-shell py-2.5" @change="sortOrder = ($event.target as HTMLSelectElement).value as 'asc' | 'desc'">
            <option v-for="item in sortOrderOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </div>
      </template>
      <template #filter-menu>
        <div class="space-y-3">
          <select :value="draftFilters.coopId" class="field-shell py-2.5" @change="draftFilters.coopId = ($event.target as HTMLSelectElement).value"><option value="">{{ t('stock.allCoops') }}</option><option v-for="item in coopOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select>
          <select :value="draftFilters.type" class="field-shell py-2.5" @change="draftFilters.type = ($event.target as HTMLSelectElement).value"><option value="">{{ t('coopHealth.allTypes') }}</option><option v-for="item in typeOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select>
          <div class="grid grid-cols-2 gap-2.5">
            <UiDatePicker v-model="draftFilters.startDate" :label="t('date.start')" :placeholder="t('date.pickStart')" />
            <UiDatePicker v-model="draftFilters.endDate" :label="t('date.end')" :placeholder="t('date.pickEnd')" />
          </div>
          <div class="flex justify-end gap-2"><UiButton size="sm" variant="ghost" icon="refresh" @click="resetFilters">{{ t('common.reset') }}</UiButton><UiButton size="sm" icon="filter" @click="applyFilters">{{ t('common.apply') }}</UiButton></div>
        </div>
      </template>
      <template #default>
        <table class="min-w-full text-left text-sm">
          <thead class="sticky top-0 z-10 bg-white/90 text-ink-500 backdrop-blur-sm"><tr><th class="px-4 py-3">{{ t('common.date') }}</th><th class="px-4 py-3">{{ t('common.coop') }}</th><th class="px-4 py-3">{{ t('coopHealth.type') }}</th><th class="px-4 py-3">{{ t('coopHealth.descriptionField') }}</th><th class="px-4 py-3">{{ t('common.notes') }}</th><th class="px-4 py-3 text-right">{{ t('common.actions') }}</th></tr></thead>
          <ListTableStateBody v-if="error" mode="error" :colspan="6" :message="error" @retry="loadRecords" />
          <tbody v-else-if="records.length"><tr v-for="item in records" :key="item.id" class="border-t border-slate-200/70"><td class="px-4 py-4">{{ formatDate(item.date) }}</td><td class="px-4 py-4">{{ item.coopName }}</td><td class="px-4 py-4"><span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="typeBadgeClass(item.type)">{{ t(`coopHealth.type.${item.type}`) }}</span></td><td class="px-4 py-4">{{ item.description }}</td><td class="px-4 py-4">{{ item.notes || '-' }}</td><td class="px-4 py-4 text-right"><div v-if="can('coop-health.manage')" class="flex justify-end gap-1"><UiButton variant="ghost" size="sm" icon="edit" @click="openEditDialog(item)">{{ t('common.edit') }}</UiButton><UiButton variant="ghost" size="sm" icon="delete" @click="deleteDialogOpen = true; deleting = item">{{ t('common.delete') }}</UiButton></div></td></tr></tbody>
          <ListTableStateBody v-else mode="empty" :colspan="6" :message="t('coopHealth.emptyFiltered')" />
        </table>
      </template>
    </ListTableShell>

    <UiDialog v-model:open="dialogOpen" :title="editing ? t('coopHealth.dialogTitle.edit') : t('coopHealth.dialogTitle.add')" :description="t('coopHealth.dialogDescription')" size="xl">
      <FormsCoopHealthForm
        :coop-options="coopOptions"
        :type-options="typeOptions"
        :submitting="submitting"
        :initial-value="editing ? { date: isoDate(editing.date), coopId: editing.coopId, type: editing.type, description: editing.description, notes: editing.notes ?? '' } : undefined"
        @submit="submitRecord"
      />
    </UiDialog>

    <UiDialog v-model:open="deleteDialogOpen" :title="t('coopHealth.deleteTitle')" :description="t('coopHealth.deleteDescription')">
      <FormsDeleteReasonForm :submitting="submitting" @submit="deleteRecord" />
    </UiDialog>
  </div>
</template>
