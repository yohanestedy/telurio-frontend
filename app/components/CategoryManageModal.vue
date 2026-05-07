<script setup lang="ts">
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { mapZodErrors } from '../utils/form'

interface CategoryItem {
  id: string
  name: string
  isActive: boolean
}

const props = defineProps<{
  open: boolean
  title: string
  categories: CategoryItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': [payload: { name: string }]
  'update': [payload: { id: string; name: string; isActive: boolean }]
  'refresh': []
}>()

const { t } = useI18n()
const auth = useAuthStore()

const showForm = ref(false)
const editing = ref<CategoryItem | null>(null)
const submitting = ref(false)

type FormValues = { name: string; isActive: boolean }

const { defineField, errors, handleSubmit, resetForm, setErrors } = useForm<FormValues>({
  initialValues: { name: '', isActive: true },
})

const [name] = defineField('name')
const [isActive] = defineField('isActive')

function openCreate() {
  editing.value = null
  resetForm({ values: { name: '', isActive: true } })
  showForm.value = true
}

function openEdit(item: CategoryItem) {
  editing.value = item
  resetForm({ values: { name: item.name, isActive: item.isActive } })
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editing.value = null
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

  showForm.value = false
  editing.value = null
})

watch(() => props.open, (val) => {
  if (!val) {
    showForm.value = false
    editing.value = null
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
      <div v-if="!showForm" class="space-y-3">
        <div class="max-h-[45vh] space-y-1 overflow-y-auto">
          <div
            v-for="item in categories"
            :key="item.id"
            class="flex items-center justify-between gap-3 rounded-lg bg-ink-50/50 px-3 py-2.5"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="truncate text-sm font-medium text-ink-800">{{ item.name }}</span>
              <UiBadge v-if="!item.isActive" tone="warning" class="shrink-0">{{ t('common.inactive') }}</UiBadge>
            </div>
            <UiButton
              v-if="auth.role === 'OWNER'"
              variant="ghost"
              size="sm"
              icon="edit"
              @click="openEdit(item)"
            />
          </div>

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
      <div v-else class="space-y-4">
        <form class="grid gap-4" @submit.prevent="onSubmit">
          <UiInput v-model="name" :label="t('expenseCategory.name')" :error="errors.name" />
          <UiCheckbox v-if="editing" v-model="isActive" :label="t('expenseCategory.active')" />
          <div class="flex items-center justify-between">
            <UiButton variant="ghost" size="sm" @click="cancelForm">
              ← {{ t('common.back') }}
            </UiButton>
            <UiButton :disabled="submitting" type="submit" size="sm">
              {{ t('common.save') }}
            </UiButton>
          </div>
        </form>
      </div>
    </div>
  </UiDialog>
</template>
