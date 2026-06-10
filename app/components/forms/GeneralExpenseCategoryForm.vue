<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../../utils/form'

interface CategoryItem {
  id: string
  name: string
  isActive: boolean
  ownerName?: string | null
}

const props = defineProps<{
  open: boolean
  title: string
  categories: CategoryItem[]
  loading?: boolean
  /** Show owner name column (for ADMIN viewing all owners' categories) */
  showOwner?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [payload: { name: string }]
  'update': [payload: { id: string; name: string; isActive: boolean }]
  'delete': [payload: { id: string }]
  'refresh': []
}>()

const { t } = useI18n()
const auth = useAuthStore()

type ModalView = 'list' | 'form' | 'delete-confirm'

const currentView = ref<ModalView>('list')
const editing = ref<CategoryItem | null>(null)
const deleting = ref<CategoryItem | null>(null)

type FormValues = { name: string; isActive: boolean }

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
  initialValues: { name: '', isActive: true },
})

const [name] = defineField('name')
const [isActive] = defineField('isActive')

function openCreate() {
  editing.value = null
  resetForm({ values: { name: '', isActive: true } })
  currentView.value = 'form'
}

function openEdit(item: CategoryItem) {
  editing.value = item
  resetForm({ values: { name: item.name, isActive: item.isActive } })
  currentView.value = 'form'
}

function openDeleteConfirm(item: CategoryItem) {
  deleting.value = item
  currentView.value = 'delete-confirm'
}

function backToList() {
  currentView.value = 'list'
  editing.value = null
  deleting.value = null
}

function confirmDelete() {
  if (!deleting.value) return
  emit('delete', { id: deleting.value.id })
  backToList()
}

const onSubmit = handleSubmit((values) => {
  const schema = z.object({
    name: z.string().min(2, t('validation.categoryNameMin', { min: '2' })),
    isActive: z.boolean().optional(),
  })
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    setErrors(mapZodErrors(parsed.error))
    return
  }

  if (editing.value) {
    emit('update', { id: editing.value.id, name: parsed.data.name, isActive: parsed.data.isActive ?? true })
  } else {
    emit('create', { name: parsed.data.name })
  }

  backToList()
})

watch(() => props.open, (val) => {
  if (!val) {
    backToList()
  }
})
</script>

<template>
  <UiDialog
    :open="open"
    :title="title"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-3">
      <!-- Category List -->
      <div v-if="currentView === 'list'" class="space-y-3">
        <div class="max-h-[45vh] overflow-y-auto">
          <table class="w-full text-sm">
            <thead v-if="categories.length" class="text-left text-xs text-ink-500">
              <tr>
                <th class="pb-2 pr-2 font-medium">{{ t('common.name') }}</th>
                <th v-if="showOwner" class="pb-2 pr-2 font-medium">Owner</th>
                <th class="pb-2 pr-2 font-medium">{{ t('common.status') }}</th>
                <th v-if="auth.role === 'OWNER'" class="pb-2 text-right font-medium">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in categories"
                :key="item.id"
                class="border-t border-ink-100/60"
              >
                <td class="py-2.5 pr-2 font-medium text-ink-800">{{ item.name }}</td>
                <td v-if="showOwner" class="py-2.5 pr-2 text-ink-500">{{ item.ownerName ?? '-' }}</td>
                <td class="py-2.5 pr-2">
                  <UiBadge :tone="item.isActive ? 'success' : 'warning'" class="text-[10px]">
                    {{ item.isActive ? t('common.active') : t('common.inactive') }}
                  </UiBadge>
                </td>
                <td v-if="auth.role === 'OWNER'" class="py-2.5 text-right">
                  <div class="flex items-center justify-end gap-0.5">
                    <UiButton variant="ghost" size="sm" icon="edit" @click="openEdit(item)" />
                    <UiButton variant="ghost" size="sm" icon="delete" @click="openDeleteConfirm(item)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <p v-if="!categories.length && !loading" class="py-4 text-center text-sm text-ink-400">
            {{ t('expenseCategory.empty') }}
          </p>
        </div>

        <div v-if="auth.role === 'OWNER'" class="flex justify-end border-t border-ink-100 pt-3">
          <UiButton size="sm" icon="plus" @click="openCreate">
            {{ t('common.add') }}
          </UiButton>
        </div>
      </div>

      <!-- Create/Edit Form -->
      <div v-else-if="currentView === 'form'" class="space-y-4">
        <form class="grid gap-4" @submit.prevent="onSubmit">
          <UiInput v-model="name" :label="t('expenseCategory.name')" :error="errors.name" />
          <UiCheckbox v-if="editing" v-model="isActive" :label="t('expenseCategory.active')" />
          <div class="flex items-center justify-between">
            <UiButton variant="ghost" size="sm" @click="backToList">
              ← {{ t('common.back') }}
            </UiButton>
            <UiButton type="submit" size="sm">
              {{ t('common.save') }}
            </UiButton>
          </div>
        </form>
      </div>

      <!-- Delete Confirmation -->
      <div v-else-if="currentView === 'delete-confirm'" class="space-y-4">
        <div class="rounded-xl bg-red-50 p-3">
          <p class="text-sm font-medium text-red-800">
            {{ t('expenseCategory.deleteConfirm', { name: deleting?.name ?? '' }) }}
          </p>
          <p class="mt-1 text-xs text-red-600">
            {{ t('expenseCategory.deleteWarning') }}
          </p>
        </div>
        <div class="flex items-center justify-between">
          <UiButton variant="ghost" size="sm" @click="backToList">
            ← {{ t('common.back') }}
          </UiButton>
          <UiButton variant="destructive" size="sm" @click="confirmDelete">
            {{ t('common.delete') }}
          </UiButton>
        </div>
      </div>
    </div>
  </UiDialog>
</template>
