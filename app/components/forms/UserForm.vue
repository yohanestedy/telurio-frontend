<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { roles } from '../../types/domain'

type FormValues = {
  name: string
  username: string
  password: string
  role: string
  isActive: boolean
}

const props = defineProps<{
  coopOptions: Array<{ label: string; value: string }>
  initialValue?: Partial<FormValues> & {
    coopAccesses?: Array<{
      coopId: string
      ownershipSharePercent?: string | null
    }>
  }
  submitting?: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  submit: [
    {
      name?: string
      username?: string
      password?: string
      role?: 'OWNER' | 'OPERATOR'
      isActive?: boolean
      coopAccesses?: Array<{
        coopId: string
        ownershipSharePercent?: number
      }>
    },
  ]
  cancel: []
}>()

const selectedCoopIds = ref<string[]>([])
const shareByCoop = ref<Record<string, string>>({})
const { t } = useI18n()

const createSchema = z.object({
  name: z.string().min(2, t('validation.nameMin', { min: '2' })),
  username: z.string().min(3, t('validation.usernameMin', { min: '3' })),
  password: z.string().min(8, t('validation.passwordMin', { min: '8' })),
  role: z.enum(roles),
  isActive: z.boolean().optional(),
})

const updateSchema = z.object({
  name: z.string().min(2, t('validation.nameMin', { min: '2' })),
  username: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(roles).optional(),
  isActive: z.boolean().optional(),
})

const validationSchema = computed(() => toTypedSchema(props.isEdit ? updateSchema : createSchema))

const { defineField, errors, handleSubmit, resetForm } = useForm<FormValues>({
  validationSchema,
  initialValues: {
    name: '',
    username: '',
    password: '',
    role: 'OWNER',
    isActive: true,
  },
})

const [name] = defineField('name')
const [username] = defineField('username')
const [password] = defineField('password')
const [role] = defineField('role')
const [isActive] = defineField('isActive')

watch(
  () => JSON.stringify(props.initialValue ?? null),
  () => {
    const value = props.initialValue
    resetForm({
      values: {
        name: value?.name ?? '',
        username: value?.username ?? '',
        password: '',
        role: value?.role ?? 'OWNER',
        isActive: value?.isActive ?? true,
      },
    })
    selectedCoopIds.value = value?.coopAccesses?.map((item) => item.coopId) ?? []
    shareByCoop.value = Object.fromEntries(
      (value?.coopAccesses ?? []).map((item) => [item.coopId, item.ownershipSharePercent ?? '']),
    )
  },
  { immediate: true },
)

function toggleCoop(coopId: string, checked: boolean) {
  selectedCoopIds.value = checked
    ? [...selectedCoopIds.value, coopId]
    : selectedCoopIds.value.filter((item) => item !== coopId)
}

const onSubmit = handleSubmit((values) => {
  const coopAccesses = selectedCoopIds.value.map((coopId) => ({
    coopId,
    ownershipSharePercent:
      values.role === 'OWNER' && shareByCoop.value[coopId]
        ? Number(shareByCoop.value[coopId])
        : undefined,
  }))

  emit('submit', props.isEdit
    ? {
        name: values.name,
        isActive: values.isActive,
        coopAccesses,
      }
    : {
        name: values.name,
        username: values.username,
        password: values.password,
        role: values.role as 'OWNER' | 'OPERATOR',
        coopAccesses,
      })
})
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div class="grid gap-4 md:grid-cols-2">
      <UiInput v-model="name" :label="t('common.name')" :error="errors.name" />
      <UiSelect
        v-if="!isEdit"
        v-model="role"
        :options="[
          { label: t('role.OWNER'), value: 'OWNER' },
          { label: t('role.OPERATOR'), value: 'OPERATOR' },
        ]"
        :label="t('user.role')"
        :error="errors.role"
      />
      <UiInput v-if="!isEdit" v-model="username" :label="t('user.username')" :error="errors.username" />
      <UiInput v-if="!isEdit" v-model="password" :label="t('user.password')" type="password" :error="errors.password" />
    </div>

    <div class="rounded-[24px] border border-white/40 bg-white/55 p-4">
      <p class="text-sm font-semibold text-ink-900">{{ t('user.accessScope') }}</p>
      <div class="mt-4 grid gap-3">
        <label
          v-for="coop in coopOptions"
          :key="coop.value"
          class="rounded-2xl border border-white/40 bg-white/70 p-4"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <input
                :checked="selectedCoopIds.includes(coop.value)"
                type="checkbox"
                class="h-4 w-4 rounded"
                @change="toggleCoop(coop.value, ($event.target as HTMLInputElement).checked)"
              >
              <span class="text-sm font-medium text-ink-800">{{ coop.label }}</span>
            </div>
            <UiInput
              v-if="role === 'OWNER' && selectedCoopIds.includes(coop.value)"
              v-model="shareByCoop[coop.value]"
              label=""
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Share %"
            />
          </div>
        </label>
      </div>
    </div>

    <UiCheckbox v-if="isEdit" v-model="isActive" :label="t('user.active')" />

    <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
      <UiButton type="button" variant="ghost" block class="sm:w-auto" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" icon="circleCheckBig" :disabled="submitting" block class="sm:w-auto">
        {{ submitting ? t('common.saving') : t('user.save') }}
      </UiButton>
    </div>
  </form>
</template>
