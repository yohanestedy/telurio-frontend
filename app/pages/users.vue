<script setup lang="ts">
import type { CoopItem, UserItem } from '../types/domain'

definePageMeta({
  title: 'Users',
  roles: ['ADMIN'],
})

const api = useApi()
const toast = useToast()
const pagination = usePagination()

const loading = ref(true)
const error = ref('')
const users = ref<UserItem[]>([])
const coops = ref<CoopItem[]>([])
const roleFilter = ref('')
const activeFilter = ref('')
const coopFilter = ref('')
const draftRoleFilter = ref('')
const draftActiveFilter = ref('')
const draftCoopFilter = ref('')
const dialogOpen = ref(false)
const editing = ref<UserItem | null>(null)
const submitting = ref(false)
const sortBy = ref('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

const orderByOptions = [
  { label: 'Dibuat', value: 'createdAt', kind: 'date' as const },
  { label: 'Nama', value: 'name', kind: 'text' as const },
  { label: 'Username', value: 'username', kind: 'text' as const },
  { label: 'Role', value: 'role', kind: 'text' as const },
]
const pageSizeOptions = [10, 25, 50, 100]

const coopOptions = computed(() =>
  coops.value.map((item) => ({ label: item.name, value: item.id })),
)

const selectedSortKind = computed(() => {
  const option = orderByOptions.find((item) => item.value === sortBy.value)
  return option?.kind ?? 'text'
})

const sortOrderOptions = computed(() => {
  if (selectedSortKind.value === 'date') {
    return [
      { label: 'Terlama', value: 'asc' },
      { label: 'Terbaru', value: 'desc' },
    ]
  }

  return [
    { label: 'A - Z', value: 'asc' },
    { label: 'Z - A', value: 'desc' },
  ]
})

const pageRangeLabel = computed(() => {
  if (pagination.total.value <= 0) {
    return '0 Dari 0'
  }

  const start = (pagination.page.value - 1) * pagination.limit.value + 1
  const end = Math.min(pagination.page.value * pagination.limit.value, pagination.total.value)
  return `${start}-${end} Dari ${pagination.total.value}`
})

function clearDraftFilters() {
  draftRoleFilter.value = ''
  draftActiveFilter.value = ''
  draftCoopFilter.value = ''
}

async function resetFilters() {
  clearDraftFilters()
  roleFilter.value = ''
  activeFilter.value = ''
  coopFilter.value = ''
  pagination.resetPage()
  await loadUsers()
}

async function applyFilters() {
  roleFilter.value = draftRoleFilter.value
  activeFilter.value = draftActiveFilter.value
  coopFilter.value = draftCoopFilter.value
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
      toast.success('User berhasil diperbarui')
    } else {
      await api.post('/users', payload)
      toast.success('User berhasil dibuat')
    }
    dialogOpen.value = false
    editing.value = null
    await loadUsers()
  } catch (caught) {
    toast.error('Gagal menyimpan user', api.mapError(caught).message)
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
  draftRoleFilter.value = roleFilter.value
  draftActiveFilter.value = activeFilter.value
  draftCoopFilter.value = coopFilter.value
  await Promise.all([loadSupporting(), loadUsers()])
})

watch([sortBy, sortOrder], () => {
  pagination.resetPage()
  if (!loading.value) {
    loadUsers()
  }
})

watch(
  [roleFilter, activeFilter, coopFilter],
  ([nextRole, nextActive, nextCoop]) => {
    draftRoleFilter.value = nextRole
    draftActiveFilter.value = nextActive
    draftCoopFilter.value = nextCoop
  },
)
</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard
      icon="users"
      title="Daftar User"
      description="Owner dan operator yang terhubung ke kandang."
    >
      <template #actions>
        <UiButton variant="secondary" icon="refresh" @click="loadUsers">Refresh</UiButton>
        <UiButton icon="addUser" @click="dialogOpen = true; editing = null">Tambah user</UiButton>
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
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Urutkan</p>
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
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Filter Data</p>
          </div>

          <div class="space-y-3">
            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="users" class="h-3.5 w-3.5 text-ink-500" />
                <span>Role</span>
              </p>
              <select
                :value="draftRoleFilter"
                class="field-shell py-2.5"
                @change="draftRoleFilter = ($event.target as HTMLSelectElement).value"
              >
                <option value="">Semua role</option>
                <option value="OWNER">Owner</option>
                <option value="OPERATOR">Operator</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="profile" class="h-3.5 w-3.5 text-ink-500" />
                <span>Status</span>
              </p>
              <select
                :value="draftActiveFilter"
                class="field-shell py-2.5"
                @change="draftActiveFilter = ($event.target as HTMLSelectElement).value"
              >
                <option value="">Semua status</option>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                <UiIcon name="coops" class="h-3.5 w-3.5 text-ink-500" />
                <span>Kandang</span>
              </p>
              <select
                :value="draftCoopFilter"
                class="field-shell py-2.5"
                @change="draftCoopFilter = ($event.target as HTMLSelectElement).value"
              >
                <option value="">Semua kandang</option>
                <option v-for="item in coopOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-end gap-2 border-t border-slate-200/80 pt-3">
            <UiButton size="sm" variant="ghost" icon="refresh" @click="resetFilters">
              Reset
            </UiButton>
            <UiButton size="sm" icon="filter" @click="applyFilters">
              Terapkan
            </UiButton>
          </div>
      </template>

      <template #default>
        <table class="min-w-full text-left text-sm">
          <thead class="sticky top-0 z-10 bg-white/90 text-ink-500 backdrop-blur-sm">
            <tr>
              <th class="px-4 py-3 pr-4">Nama</th>
              <th class="px-4 py-3 pr-4">Role</th>
              <th class="px-4 py-3 pr-4">Scope kandang</th>
              <th class="px-4 py-3 pr-4">Status</th>
              <th class="px-4 py-3 pr-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr
              v-for="row in pagination.limit.value"
              :key="`users-skeleton-${row}`"
              class="border-t border-slate-200/70"
            >
              <td class="px-4 py-4">
                <div class="h-4 w-11/12 animate-pulse rounded-md bg-slate-200/70" />
                <div class="mt-2 h-4 w-7/12 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-20 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-11/12 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-20 animate-pulse rounded-full bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="ml-auto h-4 w-20 animate-pulse rounded-xl bg-slate-200/70" />
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="error">
            <tr>
              <td colspan="5" class="px-4 py-14 text-center">
                <p class="text-sm text-rose-700">{{ error }}</p>
                <div class="mt-3 flex justify-center">
                  <UiButton size="sm" icon="refresh" @click="loadUsers">Coba lagi</UiButton>
                </div>
              </td>
            </tr>
          </tbody>
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
                  {{ user.isActive ? 'Aktif' : 'Nonaktif' }}
                </UiBadge>
              </td>
              <td class="px-4 py-4 text-right">
                <UiButton variant="ghost" size="sm" icon="edit" @click="dialogOpen = true; editing = user">
                  Edit
                </UiButton>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="5" class="px-4 py-14 text-center text-sm text-ink-500">
                Belum ada user untuk filter saat ini.
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </ListTableShell>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit user' : 'Tambah user'"
      description="User OWNER dan OPERATOR dapat memiliki akses ke lebih dari satu kandang."
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
