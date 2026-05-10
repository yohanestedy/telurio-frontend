<script setup lang="ts">
import type { CoopItem, UserItem } from '../types/domain'
import { defaultPageSizeOptions } from '../utils/list'

definePageMeta({
  title: 'Users',
  roles: ['ADMIN'],
})

const api = useApi()
const toast = useToast()
const pagination = usePagination()
const { t } = useI18n()

const loading = ref(true)
const error = ref('')
const users = ref<UserItem[]>([])
const coops = ref<CoopItem[]>([])
const roleFilter = ref('')
const activeFilter = ref('')
const coopFilter = ref('')
const dialogOpen = ref(false)
const editing = ref<UserItem | null>(null)
const submitting = ref(false)
const sortBy = ref('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = computed(() => [
  { label: t('common.createdAt'), value: 'createdAt', kind: 'date' as const },
  { label: t('common.name'), value: 'name', kind: 'text' as const },
  { label: 'Username', value: 'username', kind: 'text' as const },
  { label: 'Role', value: 'role', kind: 'text' as const },
])
const pageSizeOptions: number[] = [...defaultPageSizeOptions]

const coopOptions = computed(() =>
  coops.value.map((item) => ({ label: item.name, value: item.id })),
)
const skeletonCells = [
  { lines: [{ class: 'w-11/12' }, { class: 'mt-2 w-7/12' }] },
  { lines: [{ class: 'w-20' }] },
  { lines: [{ class: 'w-11/12' }] },
  { lines: [{ class: 'w-20 rounded-full' }] },
  { lines: [{ class: 'ml-auto w-20 rounded-xl' }] },
]

const { sortOrderOptions } = useListSort(sortBy, orderByOptions)
const pageRangeLabel = usePageRangeLabel(pagination)
const { draftFilters, applyDrafts, resetActive } = useListFilterDrafts({
  role: roleFilter,
  active: activeFilter,
  coopId: coopFilter,
})

async function resetFilters() {
  resetActive()
  pagination.resetPage()
  await loadUsers()
}

async function applyFilters() {
  applyDrafts()
  pagination.resetPage()
  await loadUsers()
}

async function loadSupporting() {
  const response = await api.getPage<CoopItem[]>('/coops', { all: true })
  coops.value = response.data
}

async function loadUsers() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getPage<UserItem[]>('/users', {
      ...pagination.query.value,
      sortBy: sortBy.value,
      order: sortOrder.value,
      role: roleFilter.value || undefined,
      isActive: activeFilter.value === '' ? undefined : activeFilter.value === 'true',
      coopId: coopFilter.value || undefined,
    })
    users.value = response.data
    pagination.applyMeta(response.meta)
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function submitUser(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/users/${editing.value.id}`, payload)
      toast.success(t('toast.user.updated'))
    } else {
      await api.post('/users', payload)
      toast.success(t('toast.user.created'))
    }
    dialogOpen.value = false
    editing.value = null
    await loadUsers()
  } catch (caught) {
    toast.error(t('toast.user.saveFailed'), api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

async function onPageChange(nextPage: number) {
  pagination.setPage(nextPage)
  await loadUsers()
}

async function onLimitChange(nextLimit: number) {
  pagination.setLimit(nextLimit)
  await loadUsers()
}

onMounted(async () => {
  await Promise.all([loadSupporting(), loadUsers()])
})

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadUsers()
  }
})

</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard
      icon="users"
      :title="t('user.listTitle')"
      :description="t('user.listDescription')"
    >
      <template #actions>
        <UiButton
          variant="secondary"
          icon="refresh"
          :title="t('common.refresh')"
          :aria-label="t('common.refresh')"
          @click="loadUsers"
        />
        <UiButton icon="addUser" @click="dialogOpen = true; editing = null">{{ t('common.add') }}</UiButton>
      </template>
    </ListHeaderCard>

    <ListTableShell
      :filter-applied="Boolean(roleFilter) || Boolean(activeFilter) || Boolean(coopFilter)"
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

          <div class="space-y-3">
            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="users" class="h-3.5 w-3.5 text-ink-500" />
                <span>Role</span>
              </p>
              <select
                :value="draftFilters.role"
                class="field-shell py-2.5"
                @change="draftFilters.role = ($event.target as HTMLSelectElement).value"
              >
                <option value="">{{ t('user.allRoles') }}</option>
                <option value="OWNER">Owner</option>
                <option value="OPERATOR">Operator</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="profile" class="h-3.5 w-3.5 text-ink-500" />
                <span>{{ t('common.status') }}</span>
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

            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="coops" class="h-3.5 w-3.5 text-ink-500" />
                <span>{{ t('common.coop') }}</span>
              </p>
              <select
                :value="draftFilters.coopId"
                class="field-shell py-2.5"
                @change="draftFilters.coopId = ($event.target as HTMLSelectElement).value"
              >
                <option value="">{{ t('stock.allCoops') }}</option>
                <option v-for="item in coopOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>
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
              <th class="px-4 py-3 pr-4">Role</th>
              <th class="px-4 py-3 pr-4">{{ t('common.scopeCoop') }}</th>
              <th class="px-4 py-3 pr-4">{{ t('common.status') }}</th>
              <th class="px-4 py-3 pr-4 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <ListTableSkeletonBody
            v-if="loading"
            :rows="pagination.limit.value"
            row-key-prefix="users-skeleton"
            :cells="skeletonCells"
          />
          <ListTableStateBody
            v-else-if="error"
            mode="error"
            :colspan="5"
            :message="error"
            @retry="loadUsers"
          />
          <tbody v-else-if="users.length">
            <tr v-for="user in users" :key="user.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4">
                <p class="font-medium text-ink-900">{{ user.name }}</p>
                <p class="text-xs text-ink-500">{{ user.username }}</p>
              </td>
              <td class="px-4 py-4 pr-4">{{ roleLabel(user.role) }}</td>
              <td class="px-4 py-4 pr-4">
                {{ user.coopAccesses.map((item) => item.coopName).join(', ') || '-' }}
              </td>
              <td class="px-4 py-4 pr-4">
                <UiBadge :tone="user.isActive ? 'success' : 'danger'">
                  {{ user.isActive ? t('common.active') : t('common.inactive') }}
                </UiBadge>
              </td>
              <td class="px-4 py-4 text-right">
                <UiButton variant="ghost" size="sm" icon="edit" @click="dialogOpen = true; editing = user">
                  {{ t('common.edit') }}
                </UiButton>
              </td>
            </tr>
          </tbody>
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="5"
            :message="t('user.emptyFiltered')"
          />
        </table>
      </template>
    </ListTableShell>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? t('user.dialogTitle.edit') : t('user.dialogTitle.add')"
      :description="t('user.dialogDescription')"
      size="xl"
    >
      <FormsUserForm
        :coop-options="coopOptions"
        :submitting="submitting"
        :is-edit="Boolean(editing)"
        :initial-value="editing ? {
          name: editing.name,
          role: editing.role,
          isActive: editing.isActive,
          coopAccesses: editing.coopAccesses.map((item) => ({
            coopId: item.coopId,
            ownershipSharePercent: item.ownershipSharePercent,
          })),
        } : undefined"
        @submit="submitUser"
      />
    </UiDialog>
  </div>
</template>
