<script setup lang="ts">
import type { GeneralExpenseCategoryItem } from '../types/domain'

definePageMeta({
  title: 'General Expense Categories',
  roles: ['ADMIN', 'OWNER'],
})

const api = useApi()
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const loading = ref(true)
const error = ref('')
const categories = ref<GeneralExpenseCategoryItem[]>([])
const dialogOpen = ref(false)
const editing = ref<GeneralExpenseCategoryItem | null>(null)
const submitting = ref(false)
const formName = ref('')

const skeletonCells = [
  { lines: [{ class: 'w-10/12' }] },
  { lines: [{ class: 'ml-auto w-20 rounded-xl' }] },
]

async function loadCategories() {
  loading.value = true
  error.value = ''
  try {
    categories.value = await api.get<GeneralExpenseCategoryItem[]>('/general-expense-categories')
  } catch (caught) {
    error.value = api.mapError(caught).message
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!formName.value.trim()) return
  submitting.value = true
  try {
    if (editing.value) {
      await api.patch(`/general-expense-categories/${editing.value.id}`, {
        name: formName.value.trim(),
      })
      toast.success(t('toast.expenseCategory.updated'))
    } else {
      await api.post('/general-expense-categories', {
        name: formName.value.trim(),
      })
      toast.success(t('toast.expenseCategory.created'))
    }
    dialogOpen.value = false
    editing.value = null
    await loadCategories()
  } catch (caught) {
    toast.error(api.mapError(caught).message)
  } finally {
    submitting.value = false
  }
}

onMounted(loadCategories)
</script>

<template>
  <div class="space-y-4">
    <ListHeaderCard
      icon="wallet"
      :title="t('generalExpense.category.title')"
      :description="t('generalExpense.category.description')"
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
          @click="dialogOpen = true; editing = null; formName = ''"
        >
          {{ t('generalExpense.category.add') }}
        </UiButton>
      </template>
    </ListHeaderCard>

    <GlassCard>
      <div class="relative z-20 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-sm text-ink-500">
          <UiIcon name="wallet" class="h-4 w-4 text-brand-700" />
          <span>{{ t('generalExpense.category.description') }}</span>
        </div>
      </div>

      <div class="my-3 h-px bg-slate-200/80" />

      <div class="relative z-10 h-[420px] overflow-auto rounded-2xl border border-slate-200/80 bg-white/55">
        <table class="min-w-full text-left text-sm">
          <thead class="sticky top-0 z-10 bg-white/90 text-ink-500 backdrop-blur-sm">
            <tr>
              <th class="px-4 py-3 pr-4">{{ t('common.name') }}</th>
              <th class="px-4 py-3 pr-4 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <ListTableSkeletonBody
            v-if="loading"
            :rows="8"
            row-key-prefix="general-expense-categories-skeleton"
            :cells="skeletonCells"
          />
          <ListTableStateBody
            v-else-if="error"
            mode="error"
            :colspan="2"
            :message="error"
            @retry="loadCategories"
          />
          <tbody v-else-if="categories.length">
            <tr v-for="item in categories" :key="item.id" class="border-t border-slate-200/70">
              <td class="px-4 py-4 pr-4 font-medium text-ink-900">{{ item.name }}</td>
              <td class="px-4 py-4 text-right">
                <UiButton
                  v-if="auth.role === 'OWNER'"
                  variant="ghost"
                  size="sm"
                  icon="edit"
                  @click="dialogOpen = true; editing = item; formName = item.name"
                >
                  {{ t('common.edit') }}
                </UiButton>
              </td>
            </tr>
          </tbody>
          <ListTableStateBody
            v-else
            mode="empty"
            :colspan="2"
            :message="t('generalExpense.category.empty')"
          />
        </table>
      </div>
    </GlassCard>

    <UiDialog
      v-model:open="dialogOpen"
      :title="editing ? t('generalExpense.category.edit') : t('generalExpense.category.add')"
    >
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <UiInput
          v-model="formName"
          :label="t('common.name')"
          :placeholder="t('generalExpense.category.namePlaceholder')"
        />
        <div class="flex justify-end gap-2 pt-2">
          <UiButton variant="secondary" @click="dialogOpen = false">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton type="submit" :disabled="submitting || !formName.trim()">
            {{ t('common.save') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>
