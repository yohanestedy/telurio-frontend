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
const dialogOpen = ref(false)
const editing = ref<UserItem | null>(null)
const submitting = ref(false)

const coopOptions = computed(() =>
  coops.value.map((item) => ({ label: item.name, value: item.id })),
)

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
      role: roleFilter.value || undefined,
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

async function onAllChange(nextAll: boolean) {
  pagination.setAll(nextAll)
  await loadUsers()
}

onMounted(async () => {
  await Promise.all([loadSupporting(), loadUsers()])
})

watch(roleFilter, () => {
  pagination.resetPage()
  loadUsers()
})
</script>

<template>
  <div class="space-y-6">
    <FilterBar>
      <UiSelect
        v-model="roleFilter"
        label="Filter role"
        placeholder="Semua role"
        :options="[
          { label: 'Owner', value: 'OWNER' },
          { label: 'Operator', value: 'OPERATOR' },
        ]"
      />
      <template #actions>
        <UiButton variant="secondary" icon="refresh" @click="loadUsers">Refresh</UiButton>
        <UiButton icon="addUser" @click="dialogOpen = true; editing = null">Tambah user</UiButton>
      </template>
    </FilterBar>

    <LoadingSkeleton
      v-if="loading"
      variant="table"
      :rows="pagination.limit.value"
      :columns="5"
    />
    <ErrorState v-else-if="error" :message="error">
      <UiButton icon="refresh" @click="loadUsers">Coba lagi</UiButton>
    </ErrorState>
    <TableCard v-else title="Daftar User" description="Owner dan operator yang terhubung ke kandang." icon="users">
      <table class="min-w-full text-left text-sm">
        <thead class="text-ink-500">
          <tr>
            <th class="pb-3 pr-4">Nama</th>
            <th class="pb-3 pr-4">Role</th>
            <th class="pb-3 pr-4">Scope kandang</th>
            <th class="pb-3 pr-4">Status</th>
            <th class="pb-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="border-t border-white/40">
            <td class="py-4 pr-4">
              <p class="font-medium text-ink-900">{{ user.name }}</p>
              <p class="text-xs text-ink-500">{{ user.username }}</p>
            </td>
            <td class="py-4 pr-4">{{ roleLabel(user.role) }}</td>
            <td class="py-4 pr-4">{{ user.coopAccesses.map((item) => item.coopName).join(', ') || '-' }}</td>
            <td class="py-4 pr-4">
              <UiBadge :tone="user.isActive ? 'success' : 'danger'">
                {{ user.isActive ? 'Aktif' : 'Nonaktif' }}
              </UiBadge>
            </td>
            <td class="py-4 text-right">
              <UiButton variant="ghost" size="sm" icon="edit" @click="dialogOpen = true; editing = user">
                Edit
              </UiButton>
            </td>
          </tr>
        </tbody>
      </table>
      <TablePagination
        :page="pagination.page.value"
        :limit="pagination.limit.value"
        :all="pagination.all.value"
        :total="pagination.total.value"
        :total-pages="pagination.totalPages.value"
        :has-next-page="pagination.hasNextPage.value"
        :has-prev-page="pagination.hasPrevPage.value"
        :loading="loading"
        @update:page="onPageChange"
        @update:limit="onLimitChange"
        @update:all="onAllChange"
      />
    </TableCard>

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
