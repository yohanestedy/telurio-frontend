<script setup lang="ts">
import type { ExpenseCategoryItem } from '../types/domain'

definePageMeta({
  title: 'Expense Categories',
  roles: ['ADMIN', 'OWNER'],
})

const api = useApi()
const auth = useAuthStore()
const toast = useToast()

const loading = ref(true)
const error = ref('')
const categories = ref<ExpenseCategoryItem[]>([])
const dialogOpen = ref(false)
const editing = ref<ExpenseCategoryItem | null>(null)
const submitting = ref(false)

async function loadCategories() {
  loading.value = true
  error.value = ''
  try {
    categories.value = await api.get<ExpenseCategoryItem[]>('/expense-categories')
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function submitCategory(payload: Record<string, unknown>) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/expense-categories/${editing.value.id}`, payload)
      toast.success('Kategori berhasil diperbarui')
    } else {
      await api.post('/expense-categories', payload)
      toast.success('Kategori berhasil dibuat')
    }
    dialogOpen.value = false
    editing.value = null
    await loadCategories()
  } catch (caught) {
    toast.error('Gagal menyimpan kategori', api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

onMounted(loadCategories)
</script>

<template>
  <div class="space-y-6">
    <FilterBar>
      <template #actions>
        <UiButton variant="secondary" @click="loadCategories">Refresh</UiButton>
        <UiButton v-if="auth.role === 'OWNER'" @click="dialogOpen = true; editing = null">Tambah kategori</UiButton>
      </template>
    </FilterBar>

    <LoadingSkeleton v-if="loading" :lines="6" />
    <ErrorState v-else-if="error" :message="error">
      <UiButton @click="loadCategories">Coba lagi</UiButton>
    </ErrorState>
    <TableCard v-else title="Kategori Pengeluaran" description="Owner dapat mengelola kategori miliknya sendiri.">
      <table class="min-w-full text-left text-sm">
        <thead class="text-ink-500">
          <tr>
            <th class="pb-3 pr-4">Nama</th>
            <th class="pb-3 pr-4">Owner</th>
            <th class="pb-3 pr-4">Status</th>
            <th class="pb-3 pr-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id" class="border-t border-white/40">
            <td class="py-4 pr-4 font-medium text-ink-900">{{ category.name }}</td>
            <td class="py-4 pr-4">{{ category.ownerName }}</td>
            <td class="py-4 pr-4">
              <UiBadge :tone="category.isActive ? 'success' : 'warning'">
                {{ category.isActive ? 'Aktif' : 'Nonaktif' }}
              </UiBadge>
            </td>
            <td class="py-4 text-right">
              <UiButton
                v-if="auth.role === 'OWNER'"
                variant="ghost"
                size="sm"
                @click="dialogOpen = true; editing = category"
              >
                Edit
              </UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </TableCard>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit kategori' : 'Tambah kategori'"
      description="Kategori ini akan tersedia pada form pengeluaran."
    >
      <FormsExpenseCategoryForm
        :submitting="submitting"
        :is-edit="Boolean(editing)"
        :initial-value="editing ? {
          name: editing.name,
          isActive: editing.isActive,
        } : undefined"
        @submit="submitCategory"
      />
    </UiDialog>
  </div>
</template>
