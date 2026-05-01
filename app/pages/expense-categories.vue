<script setup lang="ts">
import type { ExpenseCategoryItem } from '../types/domain'

definePageMeta({
  title: 'Expense Categories',
  roles: ['ADMIN', 'OWNER'],
})

const api = useApi()
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const loading = ref(true)
const error = ref('')
const categories = ref<ExpenseCategoryItem[]>([])
const dialogOpen = ref(false)
const editing = ref<ExpenseCategoryItem | null>(null)
const submitting = ref(false)
type ExpenseCategoryPayload = {
  name: string
  isActive?: boolean
}
const skeletonCells = [
  { lines: [{ class: 'w-10/12' }] },
  { lines: [{ class: 'w-8/12' }] },
  { lines: [{ class: 'w-20 rounded-full' }] },
  { lines: [{ class: 'ml-auto w-20 rounded-xl' }] },
]

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

async function submitCategory(payload: ExpenseCategoryPayload) {
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/expense-categories/${editing.value.id}`, {
        name: payload.name,
        isActive: payload.isActive,
      })
      toast.success(t('toast.expenseCategory.updated'))
    } else {
      await api.post('/expense-categories', { name: payload.name })
      toast.success(t('toast.expenseCategory.created'))
    }
    dialogOpen.value = false
    editing.value = null
    await loadCategories()
  } catch (caught) {
    toast.error(t('toast.expenseCategory.saveFailed'), api.mapError(caught).message)
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
      :title="t('expenseCategory.title')"
      :description="t('expenseCategory.description')"
    >
      <template #actions>
        <UiButton
          variant="secondary"
          icon="refresh"
          :title="t('common.refresh')"
          :aria-label="t('common.refresh')"
          @click="loadCategories"
        />
        <UiButton
          v-if="auth.role === 'OWNER'"
          icon="plus"
          @click="dialogOpen = true; editing = null"
        >
          {{ t('common.add') }}
        </UiButton>
      </template>
    </ListHeaderCard>

    <GlassCard>
      <div class="relative z-20 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-sm text-ink-500">
          <UiIcon name="categories" class="h-4 w-4 text-brand-700" />
          <span>{{ t('expenseCategory.listDescription') }}</span>
        </div>
      </div>

      <div class="my-3 h-px bg-slate-200/80" />

      <div class="relative z-10 h-[420px] overflow-auto rounded-2xl border border-slate-200/80 bg-white/55">
        <table class="min-w-full text-left text-sm">
          <thead class="sticky top-0 z-10 bg-white/90 text-ink-500 backdrop-blur-sm">
            <tr>
              <th class="px-4 py-3 pr-4">{{ t('common.name') }}</th>
              <th class="px-4 py-3 pr-4">Owner</th>
              <th class="px-4 py-3 pr-4">{{ t('common.status') }}</th>
              <th class="px-4 py-3 pr-4 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <ListTableSkeletonBody
            v-if="loading"
            :rows="8"
            row-key-prefix="expense-categories-skeleton"
            :cells="skeletonCells"
          />
          <ListTableStateBody
            v-else-if="error"
            mode="error"
            :colspan="4"
            :message="error"
            @retry="loadCategories"
          />
          <tbody v-else-if="categories.length">
            <tr v-for="category in categories" :key="category.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4 font-medium text-ink-900">{{ category.name }}</td>
              <td class="px-4 py-4 pr-4">{{ category.ownerName }}</td>
              <td class="px-4 py-4 pr-4">
                <UiBadge :tone="category.isActive ? 'success' : 'warning'">
                  {{ category.isActive ? t('common.active') : t('common.inactive') }}
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
                  {{ t('common.edit') }}
                </UiButton>
              </td>
            </tr>
          </tbody>
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="4"
            :message="t('expenseCategory.empty')"
          />
        </table>
      </div>
    </GlassCard>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? t('expenseCategory.dialogTitle.edit') : t('expenseCategory.dialogTitle.add')"
      :description="t('expenseCategory.dialogDescription')"
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
