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
  <div class="space-y-4">
    <ListHeaderCard
      icon="categories"
      title="Kategori Pengeluaran"
      description="Owner dapat mengelola kategori pengeluaran miliknya sendiri."
    >
      <template #actions>
        <UiButton variant="secondary" icon="refresh" @click="loadCategories">Refresh</UiButton>
        <UiButton
          v-if="auth.role === 'OWNER'"
          icon="plus"
          @click="dialogOpen = true; editing = null"
        >
          Tambah kategori
        </UiButton>
      </template>
    </ListHeaderCard>

    <GlassCard>
      <div class="relative z-20 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-sm text-ink-500">
          <UiIcon name="categories" class="h-4 w-4 text-brand-700" />
          <span>Daftar kategori aktif dan nonaktif.</span>
        </div>
      </div>

      <div class="my-3 h-px bg-slate-200/80" />

      <div class="relative z-10 h-[420px] overflow-auto rounded-2xl border border-slate-200/80 bg-white/55">
        <table class="min-w-full text-left text-sm">
          <thead class="sticky top-0 z-10 bg-white/90 text-ink-500 backdrop-blur-sm">
            <tr>
              <th class="px-4 py-3 pr-4">Nama</th>
              <th class="px-4 py-3 pr-4">Owner</th>
              <th class="px-4 py-3 pr-4">Status</th>
              <th class="px-4 py-3 pr-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr
              v-for="row in 8"
              :key="`expense-categories-skeleton-${row}`"
              class="border-t border-slate-200/70"
            >
              <td class="px-4 py-4">
                <div class="h-4 w-10/12 animate-pulse rounded-md bg-slate-200/70" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 w-8/12 animate-pulse rounded-md bg-slate-200/70" />
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
              <td colspan="4" class="px-4 py-14 text-center">
                <p class="text-sm text-rose-700">{{ error }}</p>
                <div class="mt-3 flex justify-center">
                  <UiButton size="sm" icon="refresh" @click="loadCategories">Coba lagi</UiButton>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="categories.length">
            <tr v-for="category in categories" :key="category.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4 font-medium text-ink-900">{{ category.name }}</td>
              <td class="px-4 py-4 pr-4">{{ category.ownerName }}</td>
              <td class="px-4 py-4 pr-4">
                <UiBadge :tone="category.isActive ? 'success' : 'warning'">
                  {{ category.isActive ? 'Aktif' : 'Nonaktif' }}
                </UiBadge>
              </td>
              <td class="px-4 py-4 text-right">
                <UiButton
                  v-if="auth.role === 'OWNER'"
                  variant="ghost"
                  size="sm"
                  icon="edit"
                  @click="dialogOpen = true; editing = category"
                >
                  Edit
                </UiButton>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="4" class="px-4 py-14 text-center text-sm text-ink-500">
                Belum ada kategori pengeluaran.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </GlassCard>

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
